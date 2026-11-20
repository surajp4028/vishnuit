import { queryOne } from "@/lib/server/db";
import { signedUrl } from "@/lib/server/s3";

/** Profile photo: redirects to a short-lived signed S3 link (objects stay private). */
export async function GET(_req: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^VISHNU\d{5,10}$/.test(uid)) return new Response("Not found", { status: 404 });
  const u = await queryOne<{ avatar_key: string | null }>("SELECT avatar_key FROM users WHERE uid=?", [uid]);
  if (!u?.avatar_key) return new Response("Not found", { status: 404 });
  const url = await signedUrl(u.avatar_key, 3600);
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, max-age=1800" } });
}
