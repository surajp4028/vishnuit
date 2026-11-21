import "server-only";
import { exec, query, queryOne } from "./db";
import { getCatalogConfig, storageLimit, type Store } from "./catalog";
import { objectSize } from "./s3";

/*
 * Per-store storage = every photo/video in the store's media library (store_media.bytes).
 * Plan limits live in Admin → Catalog Stores → Plans (storageMb).
 */

/** Older library rows (from before sizes were recorded) get their size from S3 once. */
async function fillMissingSizes(storeId: number) {
  const rows = await query<{ id: number; s3_key: string }>("SELECT id, s3_key FROM store_media WHERE store_id=? AND bytes IS NULL LIMIT 40", [storeId]);
  await Promise.all(rows.map(async (r) => {
    const n = await objectSize(r.s3_key);
    await exec("UPDATE store_media SET bytes=? WHERE id=?", [n ?? 0, r.id]);
  }));
}

/** Video uploads that never finished step 2: keep the file (as a real video) if it arrived, else drop the row. */
async function settlePending(storeId: number) {
  const rows = await query<{ id: number; s3_key: string }>("SELECT id, s3_key FROM store_media WHERE store_id=? AND kind='video-pending' AND created_at < NOW() - INTERVAL 1 HOUR LIMIT 20", [storeId]);
  await Promise.all(rows.map(async (r) => {
    const n = await objectSize(r.s3_key);
    if (n == null) await exec("DELETE FROM store_media WHERE id=?", [r.id]);
    else await exec("UPDATE store_media SET kind='video', bytes=? WHERE id=?", [n, r.id]);
  }));
}

export async function storageUsage(store: Pick<Store, "id" | "plan" | "plan_expires_at">) {
  await Promise.all([fillMissingSizes(store.id), settlePending(store.id)]).catch(() => {});
  const r = await queryOne<{ used: number | null; files: number }>("SELECT SUM(COALESCE(bytes,0)) used, COUNT(*) files FROM store_media WHERE store_id=?", [store.id]);
  const { plans } = await getCatalogConfig();
  const limit = storageLimit(store, plans);
  return { used: Number(r?.used ?? 0), limit, files: Number(r?.files ?? 0) };
}

/** null when `extra` bytes still fit, else a message for the seller. */
export async function storageProblem(store: Pick<Store, "id" | "plan" | "plan_expires_at">, extra: number) {
  const u = await storageUsage(store);
  if (u.used + extra <= u.limit) return null;
  return `Storage full: ${fmtBytes(u.used)} of ${fmtBytes(u.limit)} used. Delete unused photos/videos from the media library or upgrade your plan.`;
}

/** 1024 → "1 KB", 1 GB stays "1 GB" (no ".0"). */
export const fmtBytes = (n: number) => {
  const t = (v: number, d: number) => String(+v.toFixed(d));
  if (n >= 1024 ** 3) return `${t(n / 1024 ** 3, n >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (n >= 1024 ** 2) return `${t(n / 1024 ** 2, n >= 100 * 1024 ** 2 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
};
