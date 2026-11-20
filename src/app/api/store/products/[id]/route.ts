import { revalidatePath } from "next/cache";
import { exec, query, queryOne } from "@/lib/server/db";
import { hydrateProduct } from "@/lib/server/catalog";
import { requireStoreApi } from "@/lib/server/store-auth";
import { parseProduct } from "@/lib/server/product-input";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const { store } = a;
  if (!(await queryOne("SELECT id FROM store_products WHERE id=? AND store_id=?", [id, store.id]))) return Response.json({ error: "Product not found." }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Quick toggles from the list (status / featured) without resending the whole product.
  if (body.quick) {
    if (body.status === "active" || body.status === "draft") await exec("UPDATE store_products SET status=? WHERE id=? AND store_id=?", [body.status, id, store.id]);
    if (typeof body.featured === "boolean") await exec("UPDATE store_products SET featured=? WHERE id=? AND store_id=?", [body.featured ? 1 : 0, id, store.id]);
  } else {
    const cats = (await query<{ id: number }>("SELECT id FROM store_categories WHERE store_id=?", [store.id])).map((c) => c.id);
    const p = parseProduct(body, store.code, cats);
    if ("error" in p) return Response.json({ error: p.error }, { status: 422 });
    const d = p.data;
    await exec(
      "UPDATE store_products SET category_id=?, name=?, description=?, price=?, compare_price=?, sku=?, stock=?, images=?, options=?, variants=?, status=?, featured=? WHERE id=? AND store_id=?",
      [d.category_id, d.name, d.description, d.price, d.compare_price, d.sku, d.stock, JSON.stringify(d.images), JSON.stringify(d.options), JSON.stringify(d.variants), d.status, d.featured, id, store.id],
    );
  }
  revalidatePath(`/catalog/@${store.handle}`, "layout");
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE id=?", [id]);
  return Response.json({ ok: true, product: hydrateProduct(row!) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  await exec("DELETE FROM store_products WHERE id=? AND store_id=?", [Number((await params).id), a.store.id]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  return Response.json({ ok: true });
}
