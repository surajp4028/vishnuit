import { exec, query, queryOne } from "@/lib/server/db";
import { imgUrl } from "@/lib/server/catalog";
import { deleteObject, isCatalogKey } from "@/lib/server/s3";
import { fmtBytes, storageUsage } from "@/lib/server/storage";
import { requireStoreApi } from "@/lib/server/store-auth";

type Row = { s3_key: string; kind: string; bytes: number | null; width: number | null; height: number | null; created_at: string };

/** One-time: add images the store already uses (from before the media library existed). */
async function backfill(storeId: number, code: string) {
  const keys = new Set<string>();
  for (const r of await query<{ images: unknown }>("SELECT images FROM store_products WHERE store_id=?", [storeId])) {
    for (const k of (typeof r.images === "string" ? JSON.parse(r.images) : (r.images as string[] | null)) ?? []) keys.add(k);
  }
  const s = await queryOne<{ logo_key: string | null; banner_key: string | null; storefront: unknown }>("SELECT logo_key, banner_key, storefront FROM stores WHERE id=?", [storeId]);
  if (s?.logo_key) keys.add(s.logo_key);
  if (s?.banner_key) keys.add(s.banner_key);
  const f = (typeof s?.storefront === "string" ? JSON.parse(s.storefront) : s?.storefront) as { banners?: { key: string }[]; about?: { images?: string[] } } | null;
  f?.banners?.forEach((b) => keys.add(b.key));
  f?.about?.images?.forEach((k) => keys.add(k));
  for (const k of keys) if (isCatalogKey(k, code)) await exec("INSERT IGNORE INTO store_media (store_id, s3_key, kind) VALUES (?,?,?)", [storeId, k, k.split("/").at(-2) ?? "product"]);
}

/** The store's media library, newest first. ?kind=product|banner|logo filters; ?before=<iso> pages. */
export async function GET(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const url = new URL(req.url);
  if (!(await queryOne("SELECT id FROM store_media WHERE store_id=? LIMIT 1", [a.store.id]))) await backfill(a.store.id, a.store.code);
  const kind = url.searchParams.get("kind");
  const before = url.searchParams.get("before");
  const where = ["store_id=?"]; const p: unknown[] = [a.store.id];
  if (kind && /^[a-z]+$/.test(kind)) { where.push("kind=?"); p.push(kind); }
  else where.push("kind NOT LIKE 'video%'"); // the photo picker never lists videos (or half-finished uploads)
  if (before) { where.push("created_at<?"); p.push(before); }
  const rows = await query<Row>(`SELECT s3_key, kind, bytes, width, height, created_at FROM store_media WHERE ${where.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT 60`, p);
  const u = await storageUsage(a.store);
  return Response.json({
    items: rows.map((r) => ({ key: r.s3_key, url: imgUrl(r.s3_key), kind: r.kind, bytes: r.bytes, width: r.width, height: r.height, at: String(r.created_at) })),
    more: rows.length === 60,
    usage: { ...u, label: `${fmtBytes(u.used)} of ${fmtBytes(u.limit)}` },
  });
}

/** Delete a file from the library (and S3) to free space — only if nothing in the store still uses it. */
export async function DELETE(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const key = new URL(req.url).searchParams.get("k") ?? "";
  if (!isCatalogKey(key, a.store.code)) return Response.json({ error: "Not found." }, { status: 404 });
  const inProduct = await queryOne<{ name: string }>("SELECT name FROM store_products WHERE store_id=? AND (JSON_CONTAINS(images, JSON_QUOTE(?)) OR video=?) LIMIT 1", [a.store.id, key, key]);
  if (inProduct) return Response.json({ error: `Used by “${inProduct.name}”. Remove it from that product first.` }, { status: 409 });
  const inStore = await queryOne("SELECT id FROM stores WHERE id=? AND (logo_key=? OR banner_key=? OR INSTR(CAST(storefront AS CHAR), ?) > 0 OR INSTR(CAST(payments AS CHAR), ?) > 0)", [a.store.id, key, key, key, key]);
  if (inStore) return Response.json({ error: "Used in your store design (logo, banner, favicon, about or UPI QR). Change it there first." }, { status: 409 });
  const r = await deleteObject(key);
  if (!r.ok) return Response.json({ error: r.error === "AccessDenied" ? "Storage won't allow deleting yet (missing delete permission) — ask support." : "Could not delete right now." }, { status: 502 });
  await exec("DELETE FROM store_media WHERE store_id=? AND s3_key=?", [a.store.id, key]);
  return Response.json({ ok: true, usage: await storageUsage(a.store) });
}
