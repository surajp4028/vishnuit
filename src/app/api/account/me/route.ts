import { getUser, publicUser } from "@/lib/server/users";
import { getCatalogConfig, getStoreForUser } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  const cfg = u ? await getCatalogConfig() : null;
  const store = u && cfg?.features.enabled ? await getStoreForUser(u.id) : null;
  const hasStore = Boolean(store);
  // With a connected domain, "Seller dashboard" opens on that domain (signed in automatically).
  const sellerUrl = store?.domain && store.domain_ok ? "/api/account/jump?to=store&next=/seller" : "/seller";
  return Response.json({ user: u ? { ...publicUser(u), storeLink: Boolean(cfg?.features.menuLink && cfg.features.newStores), hasStore, sellerUrl } : null }, { headers: { "Cache-Control": "no-store" } });
}
