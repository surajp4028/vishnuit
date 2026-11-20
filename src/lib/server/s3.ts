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

/** Every payer/user gets one folder: vishnu/payee/<UID>/ */
export const payeePath = (uid: string, file: string) => `vishnu/payee/${uid}/${file}`;
