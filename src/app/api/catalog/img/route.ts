import { signedUrl } from "@/lib/server/s3";

/** Catalog images live in a private, encrypted bucket; this hands out a short-lived signed link. */
export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get("k") ?? "";
  if (!/^catalog\/VISHNU\d{5,10}\/[a-z]+\/[\w.-]+$/.test(k)) return new Response("Not found", { status: 404 });
  const url = await signedUrl(k, 3600);
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "public, max-age=1800, s-maxage=1800" } });
}
