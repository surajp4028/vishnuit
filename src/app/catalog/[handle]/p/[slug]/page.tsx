import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query, queryOne } from "@/lib/server/db";
import { ChevronDown, Store as StoreIcon } from "lucide-react";
import { PAGE_KEYS, PAGE_TITLES, getStoreByHandle, getStoreCategories, getStoreProducts, hydrateProduct, imgUrl, storeBase, storeAbsUrl } from "@/lib/server/catalog";
import { HIGHLIGHT_ICON_MAP } from "@/components/catalog/highlight-icons";
import { ProductBuy, ProductGallery } from "@/components/catalog/product-buy";
import { StickyColumn } from "@/components/catalog/sticky-column";
import { ProductCard } from "@/components/catalog/product-card";
import { RelatedCarousel } from "@/components/catalog/related-carousel";
import type { Product } from "@/lib/server/catalog";

export const revalidate = 120;

async function load(handle: string, slug: string) {
  const s = await getStoreByHandle(handle);
  if (!s) return null;
  const r = await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE store_id=? AND slug=? AND status='active'", [s.id, decodeURIComponent(slug)]);
  return r ? { s, p: hydrateProduct(r) } : null;
}

/**
 * "You may also like": the seller's picks first (in their order). If they picked fewer than 4,
 * 4 more are added automatically — same category first, then the rest of the store.
 */
async function relatedFor(storeId: number, p: Product) {
  const picked = p.related.length
    ? (await query<Record<string, unknown>>(`SELECT * FROM store_products WHERE store_id=? AND status='active' AND id IN (${p.related.map(() => "?").join(",")})`, [storeId, ...p.related])).map(hydrateProduct)
    : [];
  const out = p.related.map((id) => picked.find((x) => x.id === id)).filter((x): x is Product => !!x && x.id !== p.id);
  if (out.length >= 4) return out;
  const seen = new Set([p.id, ...out.map((x) => x.id)]);
  const fill: Product[] = [];
  const take = (list: Product[]) => { for (const x of list) if (fill.length < 4 && !seen.has(x.id)) { fill.push(x); seen.add(x.id); } };
  if (p.category_id) take(await getStoreProducts(storeId, { activeOnly: true, categoryId: p.category_id, limit: 20 }));
  if (fill.length < 4) take(await getStoreProducts(storeId, { activeOnly: true, limit: 30 }));
  return [...out, ...fill];
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string; slug: string }> }): Promise<Metadata> {
  const { handle, slug } = await params;
  const d = await load(handle, slug);
  if (!d) return {};
  const price = `₹${d.p.price.toLocaleString("en-IN")}`;
  const description = `${price}${d.p.compare_price && d.p.compare_price > d.p.price ? ` (${Math.round((1 - d.p.price / d.p.compare_price) * 100)}% OFF)` : ""} · ${(d.p.description || `Shop ${d.p.name} at ${d.s.name}`).slice(0, 140)}`;
  const url = storeAbsUrl(d.s, `/p/${d.p.slug}`);
  return { title: d.p.name, description, openGraph: { title: `${d.p.name} — ${price}`, description, url, siteName: d.s.name }, twitter: { card: "summary_large_image", title: `${d.p.name} — ${price}`, description }, alternates: { canonical: url } };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string; slug: string }> }) {
  const { handle, slug } = await params;
  const d = await load(handle, slug);
  if (!d) notFound();
  const { s, p } = d;
  const base = storeBase(handle, s.handle);
  const images = p.images.map((k) => imgUrl(k)!);
  const [cats, related] = await Promise.all([getStoreCategories(s.id), relatedFor(s.id, p)]);
  const cat = cats.find((c) => c.id === p.category_id);
  const parentCat = cat?.parent_id ? cats.find((c) => c.id === cat.parent_id) : undefined;
  const off = p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
  const perks = s.storefront.highlights.filter((h) => h.on && h.title).slice(0, 4);
  const policies = PAGE_KEYS.filter((k) => s.pages[k]?.on && (k === "refund" || k === "shipping"));
  const acc = "group border-b border-border [&_summary::-webkit-details-marker]:hidden";
  const sum = "flex cursor-pointer list-none items-center justify-between py-5 text-[13px] font-extrabold tracking-[1.5px] uppercase";

  const inStock = p.variants.length ? p.variants.some((v) => v.stock !== 0) : p.stock !== 0;
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, image: images, description: p.description || undefined, sku: p.sku || undefined,
    brand: { "@type": "Brand", name: s.name }, category: cat?.name,
    offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`, url: storeAbsUrl(s, `/p/${p.slug}`), seller: { "@type": "Organization", name: s.name } },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section className="mx-auto max-w-7xl pt-0 sm:px-6 md:pt-8">
        <nav className="hidden pb-5 text-xs text-muted md:block"><Link href={base || "/"} className="hover:text-foreground">Home</Link> / <Link href={`${base}/shop`} className="hover:text-foreground">Shop</Link>{parentCat && <> / <Link href={`${base}/shop?c=${parentCat.slug}`} className="hover:text-foreground">{parentCat.name}</Link></>}{cat && <> / <Link href={`${base}/shop?c=${cat.slug}`} className="hover:text-foreground">{cat.name}</Link></>} / <span className="text-foreground">{p.name}</span></nav>
        <div className="grid gap-6 md:grid-cols-[1.35fr_1fr] md:gap-10 lg:gap-14">
          <StickyColumn><ProductGallery images={images} video={imgUrl(p.video)} name={p.name} badge={off >= 10 ? `${off}% OFF` : null} /></StickyColumn>
          <StickyColumn className="px-4 md:px-0">
            {cat && <Link href={`${base}/shop?c=${cat.slug}`} className="text-[11px] font-bold tracking-[3px] text-muted uppercase hover:text-foreground">{cat.name}</Link>}
            <h1 className="mt-1.5 font-display text-[1.65rem] leading-tight font-extrabold tracking-tight sm:text-4xl">{p.name}</h1>
            <p className="mt-1 text-sm text-muted">by <span className="font-semibold text-foreground">{s.name}</span></p>
            <div className="mt-5 border-t border-border pt-5">
              <ProductBuy
                p={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compare_price: p.compare_price, stock: p.stock, options: p.options, variants: p.variants, gst_rate: p.gst_rate, low_stock: p.low_stock }}
                image={images[0] ?? null} base={base} whatsapp={s.contact.whatsapp ?? ""} storeName={s.name}
              />
            </div>
            {perks.length > 0 && (
              <div className="mt-7 grid grid-cols-2 gap-2">
                {perks.map((h) => { const I = HIGHLIGHT_ICON_MAP[h.icon]; return (
                  <div key={h.title} className="flex items-center gap-2.5 rounded-2xl bg-foreground/[.035] px-3 py-3"><I className="size-[18px] shrink-0 text-foreground/70" /><span className="min-w-0"><span className="block truncate text-[12.5px] font-bold">{h.title}</span>{h.sub && <span className="block truncate text-[11px] text-muted">{h.sub}</span>}</span></div>
                ); })}
              </div>
            )}
            <div className="mt-6 border-t border-border">
              {p.description && (
                <details open className={acc}>
                  <summary className={sum}>Product details<ChevronDown className="size-4 transition group-open:rotate-180" /></summary>
                  <p className="pb-6 text-[15px] leading-relaxed whitespace-pre-line text-foreground/80">{p.description}</p>
                </details>
              )}
              {p.sku && (
                <details className={acc}>
                  <summary className={sum}>Specifications<ChevronDown className="size-4 transition group-open:rotate-180" /></summary>
                  <dl className="grid grid-cols-2 gap-y-2 pb-6 text-sm"><dt className="text-muted">SKU</dt><dd className="font-semibold">{p.sku}</dd>{p.options.map((o) => <div key={o.name} className="contents"><dt className="text-muted">{o.name}</dt><dd className="font-semibold">{o.values.join(", ")}</dd></div>)}</dl>
                </details>
              )}
              <details className={acc}>
                <summary className={sum}>Delivery & returns<ChevronDown className="size-4 transition group-open:rotate-180" /></summary>
                <div className="space-y-2 pb-6 text-[15px] leading-relaxed text-foreground/80">
                  <p>{s.payments.cod ? "Cash on delivery available. " : ""}Ships across India — you&apos;ll get updates on your phone.</p>
                  {policies.length > 0 && <p className="flex flex-wrap gap-x-4">{policies.map((k) => <Link key={k} href={`${base}/policy/${k}`} className="font-semibold underline underline-offset-4">{PAGE_TITLES[k]}</Link>)}</p>}
                </div>
              </details>
              <div className="flex items-center gap-3 py-5">
                <span className="grid size-10 place-items-center rounded-full bg-foreground/5"><StoreIcon className="size-4" /></span>
                <span className="flex-1 text-sm"><span className="block text-xs text-muted">Sold by</span><b>{s.name}</b></span>
                <Link href={`${base}/contact`} className="rounded-pill border border-border px-4 py-2 text-xs font-bold">Contact</Link>
              </div>
            </div>
          </StickyColumn>
        </div>
      </section>
      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-3 sm:mt-24 sm:px-6">
          <div className="flex items-end justify-between"><div><p className="text-[11px] font-bold tracking-[4px] text-muted">MORE TO LOVE</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">You may also like</h2></div><Link href={cat ? `${base}/shop?c=${cat.slug}` : `${base}/shop`} className="text-[13px] font-semibold text-muted hover:text-foreground">View all</Link></div>
          <RelatedCarousel>{related.map((r) => <ProductCard key={r.id} p={r} base={base} />)}</RelatedCarousel>
        </section>
      )}
    </>
  );
}
