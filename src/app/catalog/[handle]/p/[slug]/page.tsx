import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/server/db";
import { getStoreByHandle, getStoreProducts, hydrateProduct, imgUrl } from "@/lib/server/catalog";
import { ProductBuy, ProductGallery } from "@/components/catalog/product-buy";
import { ProductCard } from "@/components/catalog/product-card";

export const revalidate = 120;

async function load(handle: string, slug: string) {
  const s = await getStoreByHandle(handle);
  if (!s) return null;
  const r = await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE store_id=? AND slug=? AND status='active'", [s.id, decodeURIComponent(slug)]);
  return r ? { s, p: hydrateProduct(r) } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string; slug: string }> }): Promise<Metadata> {
  const { handle, slug } = await params;
  const d = await load(handle, slug);
  if (!d) return {};
  return { title: d.p.name, description: d.p.description?.slice(0, 160) || undefined, openGraph: { images: d.p.images[0] ? [imgUrl(d.p.images[0])!] : undefined } };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string; slug: string }> }) {
  const { handle, slug } = await params;
  const d = await load(handle, slug);
  if (!d) notFound();
  const { s, p } = d;
  const base = `/catalog/@${s.handle}`;
  const images = p.images.map((k) => imgUrl(k)!);
  const related = (await getStoreProducts(s.id, { activeOnly: true, categoryId: p.category_id ?? undefined, limit: 9 })).filter((x) => x.id !== p.id).slice(0, 4);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
        <nav className="mb-5 text-xs text-muted"><Link href={base} className="hover:text-foreground">Home</Link> / <Link href={`${base}/shop`} className="hover:text-foreground">Shop</Link> / <span className="text-foreground">{p.name}</span></nav>
        <div className="grid gap-8 md:grid-cols-2 md:gap-14">
          <ProductGallery images={images} name={p.name} />
          <div className="md:sticky md:top-28 md:self-start">
            <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{p.name}</h1>
            <div className="mt-5">
              <ProductBuy
                p={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compare_price: p.compare_price, stock: p.stock, options: p.options, variants: p.variants }}
                image={images[0] ?? null} base={base} whatsapp={s.contact.whatsapp ?? ""} storeName={s.name}
              />
            </div>
            {p.description && (
              <div className="mt-10 border-t border-border pt-6">
                <p className="text-xs font-semibold tracking-[3px] text-muted">DETAILS</p>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-foreground/85">{p.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} base={base} />)}</div>
        </section>
      )}
    </>
  );
}
