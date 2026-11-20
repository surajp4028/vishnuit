import { cookies } from "next/headers";
import { exec, queryOne } from "@/lib/server/db";
import { findOrCreateUser, startSession, type User } from "@/lib/server/users";

type IdToken = { iss: string; aud: string; sub: string; email?: string; email_verified?: boolean; name?: string; exp: number };

/**
 * Google sends the user back here. We swap the code for tokens directly with Google (server-to-server),
 * then sign in: same Google account → same user; else a user with the same *verified* email; else a new account.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const saved = (() => { try { return JSON.parse(jar.get("g_oauth")?.value ?? "") as { state: string; next: string }; } catch { return null; } })();
  jar.delete({ name: "g_oauth", path: "/api/account/google" });
  const store = saved?.next.match(/^\/catalog\/@[\w.-]+/)?.[0];
  const fail = (why: string) => Response.redirect(new URL(`${store ? `${store}/login` : "/login"}?error=${why}`, url.origin), 302);
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
  return Response.redirect(new URL(saved.next, url.origin), 302);
}
