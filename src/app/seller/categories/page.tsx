import { query } from "@/lib/server/db";
import { getStoreCategories } from "@/lib/server/catalog";
import { requireSeller } from "@/lib/server/seller";
import { CategoriesManager } from "@/components/seller/categories";

export const metadata = { title: "Categories" };

export default async function SellerCategories() {
  const { store } = await requireSeller();
  const [cats, counts] = await Promise.all([
    getStoreCategories(store.id),
    query<{ category_id: number; n: number }>("SELECT category_id, COUNT(*) n FROM store_products WHERE store_id=? AND category_id IS NOT NULL GROUP BY category_id", [store.id]),
  ]);
  const n = Object.fromEntries(counts.map((c) => [c.category_id, Number(c.n)]));
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Categories</h1>
      <p className="mt-1 mb-5 text-sm text-muted">These show as the menu strip and “Shop by category” on your store.</p>
      <CategoriesManager initial={cats.map((c) => ({ id: c.id, parent_id: c.parent_id ?? null, name: c.name, slug: c.slug, sort: Number(c.sort), count: n[c.id] ?? 0 }))} handle={store.handle} />
    </div>
  );
}
