import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreByHandle, getStoreCategories, getStoreProducts } from "@/lib/server/catalog";
import { ProductCard } from "@/components/catalog/product-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function Shop({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ c?: string; sort?: string; q?: string }> }) {
  const [{ handle }, sp] = await Promise.all([params, searchParams]);
  const s = await getStoreByHandle(handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const cats = await getStoreCategories(s.id);
  const cat = cats.find((c) => c.slug === sp.c);
  let products = await getStoreProducts(s.id, { activeOnly: true, categoryId: cat?.id, q: sp.q });
  if (sp.sort === "low") products = products.sort((a, b) => a.price - b.price);
  if (sp.sort === "high") products = products.sort((a, b) => b.price - a.price);
  if (sp.sort === "off") products = products.sort((a, b) => (b.compare_price ? 1 - b.price / b.compare_price : 0) - (a.compare_price ? 1 - a.price / a.compare_price : 0));
  const q = (o: Record<string, string | undefined>) => {
    const u = new URLSearchParams(Object.entries({ c: sp.c, sort: sp.sort, q: sp.q, ...o }).filter(([, v]) => v) as [string, string][]).toString();
    return `${base}/shop${u ? `?${u}` : ""}`;
  };
  const title = sp.q ? `Results for “${sp.q}”` : cat ? cat.name : "All products";
  return (
    <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 sm:pt-8">
      <nav className="text-xs text-muted"><Link href={base} className="hover:text-foreground">Home</Link> / <span className="text-foreground">{cat ? cat.name : "Shop"}</span></nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{title} <span className="text-base font-medium text-muted">· {products.length} item{products.length === 1 ? "" : "s"}</span></h1>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-muted">Sort by</span>
          <div className="flex overflow-x-auto rounded-full border border-border p-0.5 [scrollbar-width:none]">
            {[["", "New"], ["low", "Price ↑"], ["high", "Price ↓"], ["off", "Discount"]].map(([k, l]) => <Link key={l} href={q({ sort: k || undefined })} className={cn("shrink-0 rounded-full px-3 py-1.5 font-semibold", (sp.sort ?? "") === k ? "bg-foreground text-background" : "text-muted")}>{l}</Link>)}
          </div>
        </div>
      </div>
      {sp.q && <Link href={q({ q: undefined })} className="mt-3 inline-block rounded-full bg-foreground/5 px-3 py-1 text-xs font-semibold">Clear search ✕</Link>}
      {products.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} base={base} />)}</div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center"><p className="font-semibold">Nothing found</p><p className="mt-1 text-sm text-muted">Try another word or browse all products.</p><Link href={`${base}/shop`} className="mt-5 inline-block rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background">Browse all</Link></div>
      )}
    </section>
  );
}
