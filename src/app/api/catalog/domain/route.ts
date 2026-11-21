import { handleForDomain } from "@/lib/server/catalog";

/**
 * Used by src/proxy.ts: which store owns this host?
 * - found      → 200, cached at the edge for 60s
 * - not found  → 200 {handle:null}, cached only 10s (so a newly connected domain shows up quickly)
 * - DB error   → 503, never cached (a short DB blip must not turn into minutes of "not connected")
 */
export async function GET(req: Request) {
  const host = new URL(req.url).searchParams.get("host") ?? "";
  if (!host) return Response.json({ handle: null }, { headers: { "Cache-Control": "public, s-maxage=10" } });
  let handle: string | null;
  try {
    handle = await handleForDomain(host);
  } catch (e) {
    console.error("[catalog/domain] lookup failed:", (e as Error).message);
    return Response.json({ error: "lookup failed" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(
    { handle },
    { headers: { "Cache-Control": handle ? "public, s-maxage=60, stale-while-revalidate=300" : "public, s-maxage=10" } },
  );
}
