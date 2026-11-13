import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";

// Images are stored in MySQL so uploads work on serverless hosts (Vercel) where the filesystem is read-only.
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"];
const MAX = 4 * 1024 * 1024; // Vercel request body limit is ~4.5 MB

export async function POST(req: Request) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (!TYPES.includes(file.type)) return Response.json({ error: "Only PNG, JPG, WEBP, GIF, SVG or AVIF images" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Max 4 MB per image — please compress it (e.g. tinypng.com)" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const r = await exec("INSERT INTO media (name, mime, size, data) VALUES (?,?,?,?)", [file.name.slice(0, 190), file.type, file.size, buf]);
  return Response.json({ ok: true, url: `/media/${r.insertId}` });
}
