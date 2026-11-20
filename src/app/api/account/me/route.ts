import { getUser, publicUser } from "@/lib/server/users";
import { getCatalogConfig } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  const store = u ? (await getCatalogConfig()).features.menuLink : false;
  return Response.json({ user: u ? { ...publicUser(u), storeLink: store } : null }, { headers: { "Cache-Control": "no-store" } });
}
