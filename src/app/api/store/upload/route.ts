import sharp from "sharp";
import { putObject, s3Configured } from "@/lib/server/s3";
import { exec } from "@/lib/server/db";
import { catalogKey, imgUrl } from "@/lib/server/catalog";
import { requireStoreApi } from "@/lib/server/store-auth";
import { storageProblem } from "@/lib/server/storage";

const MAX_BYTES = 4.4 * 1024 * 1024;
const KINDS = { product: 1600, logo: 600, banner: 2000, qr: 900, category: 900 } as const;

/** Upload an image for the store → resized WebP in S3 at catalog/<CODE>/<kind>/… */
export async function POST(req: Request) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  if (!s3Configured()) return Response.json({ error: "Uploads are not configured." }, { status: 503 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "product") as keyof typeof KINDS;
  if (!(kind in KINDS)) return Response.json({ error: "Bad upload type." }, { status: 422 });
  if (!(file instanceof File) || !file.type.startsWith("image/")) return Response.json({ error: "Choose an image." }, { status: 422 });
  // Vercel rejects request bodies over 4.5 MB before they reach us; the browser downscales big photos first.
  if (file.size > MAX_BYTES) return Response.json({ error: "Image too large — please use a photo under 4 MB." }, { status: 413 });
  try {
    const { data: out, info } = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: KINDS[kind], height: KINDS[kind], fit: "inside", withoutEnlargement: true })
      .webp({ quality: kind === "qr" ? 95 : 82 })
      .toBuffer({ resolveWithObject: true });
    const full = await storageProblem(a.store, out.length);
    if (full) return Response.json({ error: full, code: "storage" }, { status: 413 });
    const key = await putObject(catalogKey(a.store.code, kind), out, "image/webp");
    // Remember it in the store's media library (so it can be reused without re-uploading).
    await exec("INSERT IGNORE INTO store_media (store_id, s3_key, kind, bytes, width, height) VALUES (?,?,?,?,?,?)", [a.store.id, key, kind, out.length, info.width, info.height]).catch(() => {});
    return Response.json({ ok: true, key, url: imgUrl(key) });
  } catch (e) {
    console.error("[store/upload]", (e as Error).message);
    return Response.json({ error: "Could not process this image. Try a JPG or PNG." }, { status: 422 });
  }
}
