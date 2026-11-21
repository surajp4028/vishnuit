import { safeNextPath } from "@/lib/safe-next";
import { cookies } from "next/headers";
import { after } from "next/server";
import sharp from "sharp";
import { payeePath, putObject, s3Configured } from "@/lib/server/s3";
import { exec, queryOne } from "@/lib/server/db";
import { createToken, findOrCreateUser, startSession, type User } from "@/lib/server/users";
import { randomBytes } from "node:crypto";
import { storeOrigin } from "@/lib/server/domains";

type IdToken = { iss: string; aud: string; sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string; exp: number };

/**
 * Google sends the user back here. We swap the code for tokens directly with Google (server-to-server),
 * then sign in: same Google account → same user; else a user with the same *verified* email; else a new account.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const saved = (() => { try { return JSON.parse(jar.get("g_oauth")?.value ?? "") as { state: string; next: string; to?: string | null }; } catch { return null; } })();
  jar.delete({ name: "g_oauth", path: "/api/account/google" });
  const store = saved?.next.match(/^\/catalog\/@[\w.-]+/)?.[0];
  const fail = (why: string) => saved?.to
    ? Response.redirect(`${storeOrigin(saved.to)}/login?error=${why}`, 302)
    : Response.redirect(new URL(`${store ? `${store}/login` : "/login"}?error=${why}`, url.origin), 302);
  const code = url.searchParams.get("code");
  if (!saved || !code || url.searchParams.get("state") !== saved.state) return fail("google");

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: `${url.origin}/api/account/google/callback`, grant_type: "authorization_code" }),
  }).catch(() => null);
  const tok = (await r?.json().catch(() => null)) as { id_token?: string } | null;
  if (!r?.ok || !tok?.id_token) return fail("google");
  // The ID token came straight from Google's token endpoint over TLS, so its claims can be trusted (OIDC §3.1.3.7).
  const claims = JSON.parse(Buffer.from(tok.id_token.split(".")[1] ?? "", "base64url").toString() || "{}") as IdToken;
  const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID || !claims.sub || claims.exp * 1000 < Date.now()) return fail("google");
  if (!claims.email || !claims.email_verified) return fail("google_email");
  const email = claims.email.toLowerCase();

  let u = await queryOne<User>("SELECT * FROM users WHERE google_sub=?", [claims.sub]);
  if (!u) {
    u = await queryOne<User>("SELECT * FROM users WHERE email=?", [email]);
    if (u) await exec("UPDATE users SET google_sub=? WHERE id=? AND google_sub IS NULL", [claims.sub, u.id]);
    else {
      u = await findOrCreateUser({ name: claims.name ?? "", email, source: "google" });
      await exec("UPDATE users SET google_sub=? WHERE id=?", [claims.sub, u.id]);
    }
  }
  if ((u as User & { status?: string }).status === "blocked") return fail("blocked");
  await startSession(u);
  // First Google login without a profile photo → save their Google photo as the DP (in the background).
  const pic = claims.picture;
  const owner = u;
  if (!owner.avatar_key && pic && /^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(pic) && s3Configured()) {
    after(async () => {
      try {
        const r = await fetch(pic.replace(/=s\d+(-c)?$/, "=s400-c"));
        if (!r.ok) return;
        const img = await sharp(Buffer.from(await r.arrayBuffer())).resize(400, 400, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
        const key = await putObject(payeePath(owner.uid, `avatar-google-${Date.now()}.webp`), img, "image/webp");
        await exec("UPDATE users SET avatar_key=? WHERE id=? AND avatar_key IS NULL", [key, owner.id]);
      } catch (e) {
        console.error("[google] avatar:", (e as Error).message);
      }
    });
  }
  // Came from a store's own domain → hand the login back with a one-time code for that domain only.
  if (saved.to) {
    const code = randomBytes(24).toString("base64url");
    // Target = domain + a slice of the code, so two shoppers logging in at once don't cancel each other.
    await createToken("handoff", `${saved.to.split(":")[0]}#${code.slice(0, 10)}`, owner.id, 2, code);
    const q = new URLSearchParams({ c: code, next: safeNextPath(saved.next, "/") });
    return Response.redirect(`${storeOrigin(saved.to)}/api/account/handoff?${q}`, 302);
  }
  return Response.redirect(new URL(safeNextPath(saved.next, "/account"), url.origin), 302);
}
