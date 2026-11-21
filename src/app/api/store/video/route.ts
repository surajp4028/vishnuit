import { exec, queryOne } from "@/lib/server/db";
import { catalogKey, imgUrl } from "@/lib/server/catalog";
import { isCatalogKey, s3Configured, signedPutUrl } from "@/lib/server/s3";
import { requireStoreApi } from "@/lib/server/store-auth";
import { storageProblem } from "@/lib/server/storage";
import { deleteObject, objectSize } from "@/lib/server/s3";

const TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
const MAX_VIDEO_MB = 50;

/** Step 1: get a signed link to upload a product video straight to S3. */
export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  if (!s3Configured()) return Response.json({ error: "Uploads are not configured." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as { type?: string; size?: number };
  const ext = TYPES[String(b.type)];
  if (!ext) return Response.json({ error: "Choose an MP4, WebM or MOV video." }, { status: 422 });
  if (!(Number(b.size) > 0) || Number(b.size) > MAX_VIDEO_MB * 1024 * 1024) return Response.json({ error: `Video must be under ${MAX_VIDEO_MB} MB.` }, { status: 422 });
  const full = await storageProblem(a.store, Number(b.size));
  if (full) return Response.json({ error: full, code: "storage" }, { status: 413 });
  const size = Math.floor(Number(b.size));
  const key = catalogKey(a.store.code, "video", ext);
  const put = await signedPutUrl(key, String(b.type), size);
  // Count it against storage right away ("video-pending"), so skipping step 2 can't dodge the limit.
  await exec("INSERT IGNORE INTO store_media (store_id, s3_key, kind, bytes) VALUES (?,?,?,?)", [a.store.id, key, "video-pending", size]);
  return Response.json({ ok: true, key, ...put });
}

/** Step 2: after the browser finished uploading, remember it in the media library. */
export async function PUT(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as { key?: string; size?: number };
  if (!isCatalogKey(b.key, a.store.code, "video")) return Response.json({ error: "Bad video." }, { status: 422 });
  // Trust S3, not the browser, for the real size.
  const size = await objectSize(b.key);
  if (size == null) return Response.json({ error: "Upload not found — please try again." }, { status: 422 });
  const pending = await queryOne<{ bytes: number | null }>("SELECT bytes FROM store_media WHERE store_id=? AND s3_key=? AND kind='video-pending'", [a.store.id, b.key]);
  if (!pending) return Response.json({ error: "Start the upload again." }, { status: 422 });
  const drop = async (msg: string, status: number) => { await deleteObject(b.key!); await exec("DELETE FROM store_media WHERE store_id=? AND s3_key=?", [a.store.id, b.key]); return Response.json({ error: msg }, { status }); };
  if (size > MAX_VIDEO_MB * 1024 * 1024) return drop(`Video must be under ${MAX_VIDEO_MB} MB.`, 422);
  // Re-check storage with the real size (the pending row already holds its declared size).
  const full = await storageProblem(a.store, size - Number(pending.bytes ?? 0));
  if (full) return drop(full, 413);
  await exec("UPDATE store_media SET kind='video', bytes=? WHERE store_id=? AND s3_key=?", [size, a.store.id, b.key]);
  return Response.json({ ok: true, key: b.key, url: imgUrl(b.key) });
}
