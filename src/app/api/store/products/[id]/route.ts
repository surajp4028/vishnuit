import { deleteObject, isCatalogKey } from "@/lib/server/s3";
import { revalidatePath } from "next/cache";
import { exec, query, queryOne } from "@/lib/server/db";
import { hydrateProduct } from "@/lib/server/catalog";
import { requireStoreApi } from "@/lib/server/store-auth";
import { ownIds, parseProduct } from "@/lib/server/product-input";
import { mergeIntoLibrary } from "@/lib/server/attributes";

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
      "UPDATE store_products SET category_id=?, name=?, description=?, price=?, compare_price=?, gst_rate=?, hsn=?, sku=?, stock=?, low_stock=?, images=?, options=?, variants=?, related=?, status=?, featured=? WHERE id=? AND store_id=?",
      [d.category_id, d.name, d.description, d.price, d.compare_price, d.gst_rate, d.hsn, d.sku, d.stock, d.low_stock, JSON.stringify(d.images), JSON.stringify(d.options), JSON.stringify(d.variants), JSON.stringify(await ownIds(store.id, d.related.filter((r) => r !== id))), d.status, d.featured, id, store.id],
    );
    await mergeIntoLibrary(store.id, p.data.options).catch(() => {});
  }
  revalidatePath(`/catalog/@${store.handle}`, "layout");
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE id=?", [id]);
  return Response.json({ ok: true, product: hydrateProduct(row!) });
}

/** Delete a product. With ?images=1 its photos are also removed from S3 (unless another product still uses them). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const row = await queryOne<{ images: unknown }>("SELECT images FROM store_products WHERE id=? AND store_id=?", [id, a.store.id]);
  if (!row) return Response.json({ error: "Product not found." }, { status: 404 });
  await exec("DELETE FROM store_products WHERE id=? AND store_id=?", [id, a.store.id]);
  revalidatePath(`/catalog/@${a.store.handle}`, "layout");
  if (new URL(req.url).searchParams.get("images") !== "1") return Response.json({ ok: true });

  const keys = (typeof row.images === "string" ? JSON.parse(row.images) : (row.images as string[] | null)) ?? [];
  let removed = 0, failed = 0, err = "";
  for (const k of keys) {
    if (!isCatalogKey(k, a.store.code)) continue;
    const used = await queryOne("SELECT id FROM store_products WHERE store_id=? AND JSON_CONTAINS(images, JSON_QUOTE(?))", [a.store.id, k]);
    if (used) continue;
    const r = await deleteObject(k);
    if (r.ok) { removed++; await exec("DELETE FROM store_media WHERE store_id=? AND s3_key=?", [a.store.id, k]); } else { failed++; err = r.error ?? ""; }
  }
  return Response.json({
    ok: true, removed, failed,
    ...(failed ? { warning: `Product deleted, but ${failed} photo${failed > 1 ? "s" : ""} couldn't be removed from storage${err === "AccessDenied" ? " (the S3 user needs delete permission — ask your admin)" : ""}.` } : {}),
  });
}
