import { randomBytes } from "node:crypto";
import { getStoreForUser } from "@/lib/server/catalog";
import { createToken, getUser } from "@/lib/server/users";
import { isMainHost, mainSiteUrl, storeOrigin } from "@/lib/server/domains";

/**
 * Move the signed-in user between vishnuit.co.in and their store's own domain without logging in again.
 *   /api/account/jump?to=store&next=/seller          → https://yourbrand.com/seller   (only the owner's own domain)
 *   /api/account/jump?to=main&next=/seller/billing   → https://www.vishnuit.co.in/seller/billing
 * A one-time code (2 minutes, only valid on the target host) is redeemed by /api/account/handoff.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nextRaw = url.searchParams.get("next") || "/seller";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("\\") ? nextRaw : "/seller";
  const here = (req.headers.get("host") ?? url.host).toLowerCase();
  const u = await getUser();
  if (!u) return Response.redirect(`${url.protocol}//${here}/login?next=${encodeURIComponent(next)}`, 302);

  let target: string | null = null; // host[:port] to land on
  let origin = "";
  if (url.searchParams.get("to") === "main") {
    const m = new URL(mainSiteUrl());
    target = m.host; origin = m.origin;
  } else {
    const store = await getStoreForUser(u.id);
    if (store?.domain && store.domain_ok) { target = store.domain; origin = storeOrigin(store.domain); }
  }
  // Nothing to jump to (no connected domain) → stay on the main site's page.
  if (!target) return Response.redirect(`${mainSiteUrl()}${next}`, 302);
  const targetBare = target.split(":")[0].replace(/^www\./, "");
  if (here.split(":")[0].replace(/^www\./, "") === targetBare) return Response.redirect(`${origin}${next}`, 302);

  const code = randomBytes(24).toString("base64url");
  // The handoff route checks the host it is served on; for the main site that's the configured host (e.g. www.vishnuit.co.in).
  const tokenHost = (isMainHost(target) ? new URL(mainSiteUrl()).hostname : target.split(":")[0]).toLowerCase();
  await createToken("handoff", `${tokenHost}#${code.slice(0, 10)}`, u.id, 2, code);
  return Response.redirect(`${origin}/api/account/handoff?${new URLSearchParams({ c: code, next })}`, 302);
}
