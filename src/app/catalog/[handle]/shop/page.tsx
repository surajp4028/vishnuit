import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreByHandle, getStoreCategories, getStoreProducts, type Product } from "@/lib/server/catalog";
import { ProductCard } from "@/components/catalog/product-card";
import { ShopFilters, type Applied, type Facets } from "@/components/catalog/shop-filters";
import { flattenTree, withChildren } from "@/lib/category-tree";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

type SP = { c?: string; sort?: string; q?: string; f?: string | string[]; min?: string; max?: string; stock?: string };

const inStock = (p: Product) => (p.variants.length ? p.variants.some((v) => v.stock !== 0) : p.stock !== 0);
/** True when the product offers that option value (and, with one option, that variant isn't sold out). */
function hasValue(p: Product, name: string, v: string) {
  const o = p.options.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!o || !o.values.includes(v)) return false;
  if (p.options.length === 1) return p.variants.find((x) => x.key === v)?.stock !== 0;
  return true;
}

export default async function Shop({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<SP> }) {
  const [{ handle }, sp] = await Promise.all([params, searchParams]);
  const s = await getStoreByHandle(handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const [cats, all] = await Promise.all([getStoreCategories(s.id), getStoreProducts(s.id, { activeOnly: true, q: sp.q })]);
  const cat = cats.find((c) => c.slug === sp.c);
  const catIds = cat ? withChildren(cats, cat.id) : [];
  const parent = cat?.parent_id ? cats.find((c) => c.id === cat.parent_id) : undefined;
  const subs = cats.filter((c) => c.parent_id === (cat?.parent_id ?? cat?.id ?? -1)).sort((a, b) => a.sort - b.sort);
  const f = (Array.isArray(sp.f) ? sp.f : sp.f ? [sp.f] : []).filter((x) => x.includes(":"));
  const min = Number(sp.min) || 0;
  const max = Number(sp.max) || 0;

  // Facets come from everything matching the search, so shoppers always see what's available.
  const optMap = new Map<string, Map<string, number>>();
  for (const p of all) for (const o of p.options) {
    const key = o.name.trim();
    if (!key) continue;
    const m = optMap.get(key) ?? new Map<string, number>();
    for (const v of o.values) m.set(v, (m.get(v) ?? 0) + (hasValue(p, key, v) ? 1 : 0));
    optMap.set(key, m);
  }
  const prices = all.map((p) => p.price);
  const facets: Facets = {
    categories: flattenTree(cats).map((c) => { const ids = withChildren(cats, c.id); return { slug: c.slug, name: c.name, depth: c.depth, count: all.filter((p) => p.category_id != null && ids.includes(p.category_id)).length }; }).filter((c) => c.count > 0),
    options: [...optMap].map(([name, m]) => ({ name, values: [...m].map(([v, count]) => ({ v, count })) })),
    price: { min: prices.length ? Math.floor(Math.min(...prices)) : 0, max: prices.length ? Math.ceil(Math.max(...prices)) : 0 },
  };

  // Same option = OR (M or L), different options = AND (size M and colour Red).
  const byOpt = new Map<string, string[]>();
  for (const x of f) { const [n, ...v] = x.split(":"); byOpt.set(n, [...(byOpt.get(n) ?? []), v.join(":")]); }
  let products = all.filter((p) =>
    (!cat || (p.category_id != null && catIds.includes(p.category_id))) &&
    (!min || p.price >= min) && (!max || p.price <= max) &&
    (sp.stock !== "1" || inStock(p)) &&
    [...byOpt].every(([n, vs]) => vs.some((v) => hasValue(p, n, v))),
  );
  if (sp.sort === "low") products = products.sort((a, b) => a.price - b.price);
  if (sp.sort === "high") products = products.sort((a, b) => b.price - a.price);
  if (sp.sort === "off") products = products.sort((a, b) => (b.compare_price ? 1 - b.price / b.compare_price : 0) - (a.compare_price ? 1 - a.price / a.compare_price : 0));

  const applied: Applied = { c: cat?.slug ?? "", f, min: sp.min ?? "", max: sp.max ?? "", stock: sp.stock === "1", sort: sp.sort ?? "", q: sp.q ?? "" };
  const title = sp.q ? `“${sp.q}”` : cat ? cat.name : "All products";
  return (
    <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 sm:pt-8">
      <nav className="text-xs text-muted"><Link href={base} className="hover:text-foreground">Home</Link> / <Link href={`${base}/shop`} className="hover:text-foreground">Shop</Link>{parent && <> / <Link href={`${base}/shop?c=${parent.slug}`} className="hover:text-foreground">{parent.name}</Link></>}{cat && <> / <span className="text-foreground">{cat.name}</span></>}</nav>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{sp.q ? <span className="text-muted">Results for </span> : null}{title}</h1>
        <p className="shrink-0 pb-1 text-sm text-muted">{products.length} item{products.length === 1 ? "" : "s"}</p>
      </div>
      {cat && subs.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(() => { const top = parent ?? cat; return [{ slug: top.slug, name: `All ${top.name}` }, ...subs].map((x) => <Link key={x.slug} href={`${base}/shop?c=${x.slug}`} scroll={false} className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-semibold ${x.slug === cat.slug ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}>{x.name}</Link>); })()}
        </div>
      )}
      <div className="mt-4"><ShopFilters facets={facets} applied={applied} /></div>
      {products.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} base={base} />)}</div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center"><p className="font-display text-lg font-bold">No products match</p><p className="mt-1 text-sm text-muted">Try removing a filter or searching another word.</p><Link href={`${base}/shop`} className="mt-5 inline-block rounded-pill bg-foreground px-6 py-2.5 text-sm font-bold text-background">Clear filters</Link></div>
      )}
    </section>
  );
}
