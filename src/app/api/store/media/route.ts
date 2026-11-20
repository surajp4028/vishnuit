import { exec, query, queryOne } from "@/lib/server/db";
import { imgUrl } from "@/lib/server/catalog";
import { isCatalogKey } from "@/lib/server/s3";
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
  if (before) { where.push("created_at<?"); p.push(before); }
  const rows = await query<Row>(`SELECT s3_key, kind, bytes, width, height, created_at FROM store_media WHERE ${where.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT 60`, p);
  return Response.json({ items: rows.map((r) => ({ key: r.s3_key, url: imgUrl(r.s3_key), kind: r.kind, bytes: r.bytes, width: r.width, height: r.height, at: String(r.created_at) })), more: rows.length === 60 });
}
