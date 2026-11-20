import { getStoreByHandle, getStoreCategories, getStoreProducts } from "@/lib/server/catalog";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;
const x = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

/** /catalog/@store/sitemap.xml — store pages, categories and every live product. */
export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) return new Response("Not found", { status: 404 });
  const base = `${siteUrl()}/catalog/@${s.handle}`;
  const [cats, products] = await Promise.all([getStoreCategories(s.id), getStoreProducts(s.id, { activeOnly: true })]);
  const urls = [
    { loc: base, p: "1.0" },
    ...["/shop", "/about", "/contact"].map((p) => ({ loc: base + p, p: "0.7" })),
    ...cats.map((c) => ({ loc: `${base}/shop?c=${c.slug}`, p: "0.6" })),
    ...products.map((p) => ({ loc: `${base}/p/${p.slug}`, p: "0.8", lm: new Date(p.created_at).toISOString() })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${x(u.loc)}</loc>${"lm" in u && u.lm ? `<lastmod>${u.lm}</lastmod>` : ""}<priority>${u.p}</priority></url>`).join("")}</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
