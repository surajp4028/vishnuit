import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

/** Every payer/user gets one folder: <S3_PAYEE_DIR>/<UID>/ */
export const payeePath = (uid: string, file: string) => `${PAYEE_DIR}/${uid}/${file}`;

/** Is this a store image key (optionally: belonging to this store code / of these kinds)? */
export function isCatalogKey(k: unknown, code?: string, kinds = "[a-z]+"): k is string {
  if (typeof k !== "string") return false;
  return new RegExp(`^(?:${CATALOG_DIRS})/${code ? esc(code) : "VISHNU\\d{5,10}"}/(?:${kinds})/[\\w.-]+$`).test(k);
}
