import { requireStoreApi } from "@/lib/server/store-auth";
import { mainSiteUrl } from "@/lib/server/domains";
import { makePayToken } from "@/lib/server/pay-token";

/**
 * "Renew or change plan" on a store's own domain: make a fresh signed pay link (30 min) and open
 * vishnuit.co.in's payment page with it — no shared login cookie needed across domains.
 */
export async function GET(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return Response.redirect(new URL("/login?next=%2Fseller%2Fbilling", req.url), 302);
  const q = new URLSearchParams({ s: makePayToken(a.user.id, a.store.id) });
  return Response.redirect(`${mainSiteUrl()}/catalog/payment/${encodeURIComponent(a.store.code)}?${q}`, 302);
}
