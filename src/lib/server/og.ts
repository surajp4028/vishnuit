import "server-only";
import sharp from "sharp";
import { signedUrl } from "./s3";

/** Fetch a catalog image from S3 and return it as a PNG data URL (OG renderer can't read WebP). */
export async function pngDataUrl(key: string | null | undefined, width = 900): Promise<string | null> {
  if (!key) return null;
  try {
    const r = await fetch(await signedUrl(key, 120));
    if (!r.ok) return null;
    const png = await sharp(Buffer.from(await r.arrayBuffer())).resize({ width, withoutEnlargement: true }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}
