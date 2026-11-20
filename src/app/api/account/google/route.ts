import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { googleLoginOn } from "@/lib/server/content";
import { handleForDomain } from "@/lib/server/catalog";
import { isMainHost, mainSiteUrl } from "@/lib/server/domains";

/** Start "Continue with Google": remember where to return, then send the user to Google. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = process.env.GOOGLE_CLIENT_ID;
  const nextRaw = url.searchParams.get("next") || "/account";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("\\") ? nextRaw : "/account";
  // On a store's own domain: do the Google part on the main site, then come back here (see domains.ts).
  const host = (req.headers.get("host") ?? url.host).toLowerCase();
  if (!isMainHost(host)) {
    const q = new URLSearchParams({ next, to: host });
    return Response.redirect(`${mainSiteUrl()}/api/account/google?${q}`, 302);
  }
  if (!id || !(await googleLoginOn())) return Response.redirect(new URL(`/login?error=google_off`, url.origin), 302);
  // "to" = the store domain to return to. Only domains connected to a live store are allowed.
  const toRaw = (url.searchParams.get("to") ?? "").toLowerCase().slice(0, 200);
  const to = toRaw && /^[a-z0-9.-]+(:\d+)?$/.test(toRaw) && (await handleForDomain(toRaw.split(":")[0]).catch(() => null)) ? toRaw : null;
  const state = randomBytes(18).toString("base64url");
  (await cookies()).set("g_oauth", JSON.stringify({ state, next, to }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/account/google", maxAge: 600 });
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
