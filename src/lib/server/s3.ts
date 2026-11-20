import "server-only";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;
const s3 = () =>
  (client ??= new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || "", secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "" },
  }));

export const s3Configured = () => Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET);
const bucket = () => process.env.AWS_BUCKET!;

/** Private, encrypted upload (KMS when a key is set, else AES256). Returns the object key. */
export async function putObject(key: string, body: Buffer | Uint8Array, contentType: string) {
  const base = { Bucket: bucket(), Key: key, Body: body, ContentType: contentType };
  const kms = process.env.AWS_KMS_KEY_ID;
  if (kms) {
    try {
      await s3().send(new PutObjectCommand({ ...base, ServerSideEncryption: "aws:kms", SSEKMSKeyId: kms }));
      return key;
    } catch (e) {
      console.error("[s3] kms put failed, retrying with AES256:", (e as Error).message);
    }
  }
  await s3().send(new PutObjectCommand({ ...base, ServerSideEncryption: "AES256" }));
  return key;
}

/**
 * Signed upload link so the browser can send a big file (product video) straight to S3,
 * skipping our server's request-size limit. The browser must send exactly `headers`.
 * Needs a CORS rule on the bucket that allows PUT from the site's origins.
 */
export async function signedPutUrl(key: string, contentType: string, seconds = 600) {
  const headers = { "Content-Type": contentType, "x-amz-server-side-encryption": "AES256" };
  const url = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ServerSideEncryption: "AES256" }), { expiresIn: seconds, signableHeaders: new Set(["content-type", "x-amz-server-side-encryption"]) });
  return { url, headers };
}

/** Size in bytes of an object, or null if it doesn't exist / can't be read. */
export async function objectSize(key: string): Promise<number | null> {
  try { const r = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key })); return r.ContentLength ?? null; }
  catch { return null; }
}

/** Short-lived download link for a private object. */
export function signedUrl(key: string, seconds = 300, downloadName?: string) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ...(downloadName ? { ResponseContentDisposition: `inline; filename="${downloadName.replace(/"/g, "")}"` } : {}),
    }),
    { expiresIn: seconds },
  );
}

/* ---------- Folder layout (set in env; defaults keep today's paths) ----------
   S3_CATALOG_DIR  → store images:   <dir>/<VISHNU-ID>/<product|logo|banner|qr|category>/<file>
   S3_PAYEE_DIR    → user files:     <dir>/<VISHNU-ID>/<avatar | invoices/...>
   Keys already saved in the DB keep working if a folder is renamed later. */
const dir = (v: string | undefined, d: string) => (v ?? "").trim().replace(/^\/+|\/+$/g, "") || d;
export const CATALOG_DIR = dir(process.env.S3_CATALOG_DIR, "catalog");
export const PAYEE_DIR = dir(process.env.S3_PAYEE_DIR, "vishnu/payee");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CATALOG_DIRS = [...new Set([CATALOG_DIR, "catalog"])].map(esc).join("|");

/** Delete one object. Returns false (instead of throwing) e.g. when the IAM user lacks s3:DeleteObject. */
export async function deleteObject(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as { name?: string }).name || (e as Error).message };
  }
}

/** Every payer/user gets one folder: <S3_PAYEE_DIR>/<UID>/ */
export const payeePath = (uid: string, file: string) => `${PAYEE_DIR}/${uid}/${file}`;

/** Is this a store image key (optionally: belonging to this store code / of these kinds)? */
export function isCatalogKey(k: unknown, code?: string, kinds = "[a-z]+"): k is string {
  if (typeof k !== "string") return false;
  return new RegExp(`^(?:${CATALOG_DIRS})/${code ? esc(code) : "VISHNU\\d{5,10}"}/(?:${kinds})/[\\w.-]+$`).test(k);
}
