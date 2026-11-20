import { getStoreByHandle, getStoreProducts, imgUrl } from "@/lib/server/catalog";

/** Live search suggestions for the store header (3+ letters). */
export async function GET(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) return Response.json({ items: [] }, { status: 404 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 3) return Response.json({ items: [] });
  const rows = await getStoreProducts(s.id, { activeOnly: true, q, limit: 20 });
  const items = rows.map((p) => ({ name: p.name, slug: p.slug, price: p.price, compare: p.compare_price, image: imgUrl(p.images[0]) }));
  return Response.json({ items }, { headers: { "Cache-Control": "public, s-maxage=60" } });
}
