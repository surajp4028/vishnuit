import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getStoreByHandle, getStoreCategories, getStoreProducts, imgUrl } from "@/lib/server/catalog";
import { ProductCard } from "@/components/catalog/product-card";

export const revalidate = 120;

export default async function StoreHome({ params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const [cats, products] = await Promise.all([getStoreCategories(s.id), getStoreProducts(s.id, { activeOnly: true, limit: 24 })]);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const latest = products.filter((p) => !p.featured).slice(0, 12);
  const banner = imgUrl(s.banner_key);

  return (
    <>
      {/* hero */}
      <section className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="relative mx-auto flex min-h-[62svh] max-w-6xl items-end overflow-hidden rounded-[2rem] bg-[#0a0f1f] text-white sm:min-h-[560px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {banner && <img src={banner} alt="" className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          {!banner && <div className="absolute -top-32 -right-32 size-[480px] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,.35),transparent)]" />}
          <div className="relative w-full p-7 sm:p-12">
            <p className="text-xs font-semibold tracking-[4px] text-white/70">WELCOME TO</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl">{s.name}</h1>
            {s.tagline && <p className="mt-4 max-w-lg text-[15px] text-white/80 sm:text-lg">{s.tagline}</p>}
            <Link href={`${base}/shop`} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:gap-3">Shop now <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      {cats.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
          <div className="flex gap-2.5 overflow-x-auto pb-2">
            {cats.map((c) => <Link key={c.id} href={`${base}/shop?c=${c.slug}`} className="shrink-0 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-foreground">{c.name}</Link>)}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between"><h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Featured</h2><Link href={`${base}/shop`} className="text-sm font-semibold text-muted hover:text-foreground">View all →</Link></div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} p={p} base={base} />)}</div>
        </section>
      )}

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between"><h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{featured.length ? "New arrivals" : "Our collection"}</h2><Link href={`${base}/shop`} className="text-sm font-semibold text-muted hover:text-foreground">Shop all →</Link></div>
        {latest.length || featured.length ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">{(latest.length ? latest : featured).map((p) => <ProductCard key={p.id} p={p} base={base} />)}</div>
        ) : (
          <p className="mt-6 rounded-[1.6rem] border border-dashed border-border p-12 text-center text-muted">New products are coming soon.</p>
        )}
      </section>

      {s.about && (
        <section className="mx-auto mt-20 max-w-3xl px-5 text-center">
          <p className="text-xs font-semibold tracking-[4px] text-muted">OUR STORY</p>
          <p className="mt-5 line-clamp-5 font-display text-xl leading-relaxed sm:text-2xl">{s.about}</p>
          <Link href={`${base}/about`} className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">Read more</Link>
        </section>
      )}
    </>
  );
}
