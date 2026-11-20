import { getUser, publicUser } from "@/lib/server/users";
import { getCatalogConfig, getStoreForUser } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  const cfg = u ? await getCatalogConfig() : null;
  const hasStore = u && cfg?.features.enabled ? Boolean(await getStoreForUser(u.id)) : false;
  return Response.json({ user: u ? { ...publicUser(u), storeLink: Boolean(cfg?.features.menuLink && cfg.features.newStores), hasStore } : null }, { headers: { "Cache-Control": "no-store" } });
}
