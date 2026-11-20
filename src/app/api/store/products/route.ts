import { revalidatePath } from "next/cache";
import { exec, query, queryOne } from "@/lib/server/db";
import { effectivePlan, getCatalogConfig, hydrateProduct, productLimit, slugify } from "@/lib/server/catalog";
import { requireStoreApi } from "@/lib/server/store-auth";
import { parseProduct } from "@/lib/server/product-input";

export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const { store } = a;
  const count = await queryOne<{ n: number }>("SELECT COUNT(*) n FROM store_products WHERE store_id=?", [store.id]);
  const { plans } = await getCatalogConfig();
  const limit = productLimit(store, plans);
  if (Number(count?.n) >= limit)
    return Response.json({ error: `Your ${plans[effectivePlan(store)].name} plan allows ${limit} products. Upgrade to add more.`, code: "limit" }, { status: 403 });
  const cats = (await query<{ id: number }>("SELECT id FROM store_categories WHERE store_id=?", [store.id])).map((c) => c.id);
  const p = parseProduct((await req.json().catch(() => ({}))) as Record<string, unknown>, store.code, cats);
  if ("error" in p) return Response.json({ error: p.error }, { status: 422 });
  const d = p.data;
  let slug = slugify(d.name);
  if (await queryOne("SELECT id FROM store_products WHERE store_id=? AND slug=?", [store.id, slug])) slug = `${slug}-${Date.now().toString(36).slice(-5)}`;
  const r = await exec(
    "INSERT INTO store_products (store_id, category_id, name, slug, description, price, compare_price, gst_rate, hsn, sku, stock, images, options, variants, status, featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [store.id, d.category_id, d.name, slug, d.description, d.price, d.compare_price, d.gst_rate, d.hsn, d.sku, d.stock, JSON.stringify(d.images), JSON.stringify(d.options), JSON.stringify(d.variants), d.status, d.featured],
  );
  revalidatePath(`/catalog/@${store.handle}`, "layout");
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE id=?", [r.insertId]);
  return Response.json({ ok: true, product: hydrateProduct(row!) });
}
