import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/** Start "Continue with Google": remember where to return, then send the user to Google. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = process.env.GOOGLE_CLIENT_ID;
  const nextRaw = url.searchParams.get("next") || "/account";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("\\") ? nextRaw : "/account";
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return Response.redirect(new URL(`/login?error=google_off`, url.origin), 302);
  const state = randomBytes(18).toString("base64url");
  (await cookies()).set("g_oauth", JSON.stringify({ state, next }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/account/google", maxAge: 600 });
  const q = new URLSearchParams({
    client_id: id,
    redirect_uri: `${url.origin}/api/account/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, 302);
}
