import { handleForDomain } from "@/lib/server/catalog";

/** Used by src/proxy.ts: which store owns this host? Cached briefly at the edge. */
export async function GET(req: Request) {
  const host = new URL(req.url).searchParams.get("host") ?? "";
  const handle = host ? await handleForDomain(host).catch(() => null) : null;
  return Response.json({ handle }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
