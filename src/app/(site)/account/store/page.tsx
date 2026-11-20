import type { Metadata } from "next";
import { query } from "@/lib/server/db";
import { requireUser } from "@/lib/server/users";
import { getStoreForUser, getStoreCategories, getStoreProducts, storeForOwner } from "@/lib/server/catalog";
import { siteUrl } from "@/lib/site";
import { CreateStore } from "@/components/store/create-store";
import { StoreDashboard } from "@/components/store/store-dashboard";
import type { O } from "@/components/store/orders-panel";

export const metadata: Metadata = { title: "My store", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyStorePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser("/account/store");
  const store = await getStoreForUser(u.id);
  if (!store) {
    const base = (u.name || u.email?.split("@")[0] || "store").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
    return <CreateStore suggested={base.length >= 3 ? base : `store${u.uid.slice(-4)}`} />;
  }
  const { tab } = await searchParams;
  const [products, categories, orders] = await Promise.all([
    getStoreProducts(store.id),
    getStoreCategories(store.id),
    query<Record<string, unknown>>("SELECT * FROM store_orders WHERE store_id=? ORDER BY id DESC LIMIT 300", [store.id]),
  ]);
  const o: O[] = orders.map((r) => ({
    ...(r as unknown as O),
    items: typeof r.items === "string" ? JSON.parse(r.items) : (r.items as O["items"]),
    subtotal: Number(r.subtotal),
    created_at: String(r.created_at),
  }));
  return (
    <StoreDashboard
      initialStore={JSON.parse(JSON.stringify(storeForOwner(store)))}
      initialProducts={JSON.parse(JSON.stringify(products))}
      initialCategories={JSON.parse(JSON.stringify(categories))}
      initialOrders={JSON.parse(JSON.stringify(o))}
      initialTab={tab === "products" || tab === "orders" || tab === "settings" ? tab : "home"}
      origin={siteUrl()}
    />
  );
}
