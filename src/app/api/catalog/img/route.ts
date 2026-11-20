import { isCatalogKey, signedUrl } from "@/lib/server/s3";

/**
 * Catalog images live in a private, encrypted bucket; this hands out a signed link valid for 10 minutes.
 * The redirect itself is cached for 5 minutes, so a cached redirect never points at an expired link.
 */
export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get("k") ?? "";
  if (!isCatalogKey(k)) return new Response("Not found", { status: 404 });
  const url = await signedUrl(k, 600);
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
