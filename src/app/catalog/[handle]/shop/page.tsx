import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreByHandle, getStoreCategories, getStoreProducts } from "@/lib/server/catalog";
import { ProductCard } from "@/components/catalog/product-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function Shop({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ c?: string; sort?: string }> }) {
  const [{ handle }, sp] = await Promise.all([params, searchParams]);
  const s = await getStoreByHandle(handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const cats = await getStoreCategories(s.id);
  const cat = cats.find((c) => c.slug === sp.c);
  let products = await getStoreProducts(s.id, { activeOnly: true, categoryId: cat?.id });
  if (sp.sort === "low") products = products.sort((a, b) => a.price - b.price);
  if (sp.sort === "high") products = products.sort((a, b) => b.price - a.price);
  const q = (o: Record<string, string | undefined>) => {
    const u = new URLSearchParams(Object.entries({ c: sp.c, sort: sp.sort, ...o }).filter(([, v]) => v) as [string, string][]).toString();
    return `${base}/shop${u ? `?${u}` : ""}`;
  };
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{cat ? cat.name : "Shop all"}</h1>
      <p className="mt-2 text-sm text-muted">{products.length} product{products.length === 1 ? "" : "s"}</p>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link href={q({ c: undefined })} className={cn("shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold", !cat ? "border-foreground bg-foreground text-background" : "border-border")}>All</Link>
        {cats.map((c) => <Link key={c.id} href={q({ c: c.slug })} className={cn("shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold", cat?.id === c.id ? "border-foreground bg-foreground text-background" : "border-border")}>{c.name}</Link>)}
      </div>
      <div className="mt-3 flex gap-4 text-sm text-muted">
        <span>Sort:</span>
        {[["", "Newest"], ["low", "Price ↑"], ["high", "Price ↓"]].map(([k, l]) => <Link key={l} href={q({ sort: k || undefined })} className={cn("font-semibold", (sp.sort ?? "") === k ? "text-foreground underline underline-offset-4" : "")}>{l}</Link>)}
      </div>
      {products.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} base={base} />)}</div>
      ) : (
        <p className="mt-8 rounded-[1.6rem] border border-dashed border-border p-12 text-center text-muted">No products here yet.</p>
      )}
    </section>
  );
}
