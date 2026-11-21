import { mainSiteOnly } from "@/lib/server/hosts";
import { exec } from "@/lib/server/db";
import { payeePath, putObject, s3Configured } from "@/lib/server/s3";
import { getUser } from "@/lib/server/users";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Upload a profile photo to S3: vishnu/payee/<UID>/avatar-<time>.<ext> */
export async function POST(req: Request) {
  const notHere = await mainSiteOnly(); // account changes only on vishnuit.co.in, never from a store's own domain
  if (notHere) return notHere;
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  if (!s3Configured()) return Response.json({ error: "Uploads are not configured." }, { status: 503 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a photo." }, { status: 422 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Use a JPG, PNG or WebP image." }, { status: 422 });
  if (file.size > 3 * 1024 * 1024) return Response.json({ error: "Photo must be under 3 MB." }, { status: 422 });
  const key = await putObject(payeePath(u.uid, `avatar-${Date.now()}.${ext}`), Buffer.from(await file.arrayBuffer()), file.type);
  await exec("UPDATE users SET avatar_key=? WHERE id=?", [key, u.id]);
  return Response.json({ ok: true, avatar: `/api/account/avatar/${u.uid}?v=${encodeURIComponent(key.split("/").pop()!)}` });
}
