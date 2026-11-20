import { queryOne } from "@/lib/server/db";
import { consumeToken, startSession, type User } from "@/lib/server/users";

/**
 * Finishes Google login on a store's own domain: redeems the one-time code made by
 * /api/account/google/callback for exactly this host, then signs the shopper in here.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = (req.headers.get("host") ?? url.host).toLowerCase().split(":")[0];
  const origin = `${url.protocol}//${req.headers.get("host") ?? url.host}`;
  const nextRaw = url.searchParams.get("next") || "/";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("\\") ? nextRaw : "/";
  const c = url.searchParams.get("c") ?? "";
  const t = c.length >= 20 ? await consumeToken("handoff", `${host}#${c.slice(0, 10)}`, c) : null;
  const u = t?.user_id ? await queryOne<User & { status?: string }>("SELECT * FROM users WHERE id=?", [t.user_id]) : null;
  if (!u || u.status === "blocked") return Response.redirect(`${origin}/login?error=google`, 302);
  await startSession(u);
  return Response.redirect(`${origin}${next}`, 302);
}
