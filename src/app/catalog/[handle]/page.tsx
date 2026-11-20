import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Quote, Star } from "lucide-react";
import { HeroCarousel } from "@/components/catalog/hero-carousel";
import { HIGHLIGHT_ICON_MAP } from "@/components/catalog/highlight-icons";
import { getStoreByHandle, getStoreCategories, getStoreProducts, imgUrl } from "@/lib/server/catalog";
import { ProductCard } from "@/components/catalog/product-card";

export const revalidate = 120;

export default async function StoreHome({ params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const [cats, products] = await Promise.all([getStoreCategories(s.id), getStoreProducts(s.id, { activeOnly: true, limit: 40 })]);
  const featured = products.filter((p) => p.featured).slice(0, 10);
  const latest = products.slice(0, 12);
  const banner = imgUrl(s.banner_key);
  const catTiles = cats.map((c) => ({ ...c, img: imgUrl(products.find((p) => p.category_id === c.id && p.images[0])?.images[0]) })).slice(0, 10);
  const perks = s.storefront.highlights.filter((h) => h.on && h.title).slice(0, 4);
  const slides = s.storefront.banners.map((x) => ({ ...x, url: imgUrl(x.key)! })).filter((x) => x.url);
  const reviews = s.testimonials.on ? s.testimonials.items.filter((t) => t.on) : [];
  const avg = reviews.length ? reviews.reduce((a, t) => a + t.rating, 0) / reviews.length : 0;

  return (
    <>
      {/* hero */}
      <section className="mx-auto max-w-7xl sm:px-6 sm:pt-5">
        {slides.length ? <HeroCarousel slides={slides} interval={s.storefront.interval} fallbackLink={`${base}/shop`} /> : (
        <div className="relative isolate flex aspect-[4/5] items-end overflow-hidden bg-[#0b0d12] text-white sm:aspect-[21/9] sm:rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {banner ? <img src={banner} alt="" className="absolute inset-0 -z-10 size-full object-cover" /> : (
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_10%,rgba(212,160,23,.28),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(59,130,246,.25),transparent_55%)]" />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="w-full p-6 sm:p-12">
            <p className="text-[11px] font-semibold tracking-[5px] text-white/70">NEW SEASON</p>
            <h1 className="mt-3 max-w-xl font-display text-[2.4rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl">{s.name}</h1>
            {s.tagline && <p className="mt-3 max-w-md text-[15px] text-white/80">{s.tagline}</p>}
            <Link href={`${base}/shop`} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold tracking-wide text-black uppercase transition hover:gap-3">Shop the collection <ArrowRight className="size-4" /></Link>
          </div>
        </div>
        )}
      </section>

      {perks.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className={`mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 ${perks.length === 4 ? "lg:grid-cols-4" : perks.length === 3 ? "lg:grid-cols-3" : ""}`}>
            {perks.map((x) => { const I = HIGHLIGHT_ICON_MAP[x.icon] ?? BadgeCheck; return (
              <div key={x.title} className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 sm:px-4 sm:py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[.05] sm:size-10"><I className="size-[18px] text-foreground/75" /></span>
                <span className="min-w-0"><span className="block truncate text-[12.5px] font-semibold sm:text-[13.5px]">{x.title}</span>{x.sub && <span className="block truncate text-[11px] text-muted sm:text-xs">{x.sub}</span>}</span>
              </div>
            ); })}
          </div>
        </section>
      )}

      {catTiles.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-3 sm:mt-14 sm:px-6">
          <h2 className="text-center text-[13px] font-bold tracking-[4px] text-muted">SHOP BY CATEGORY</h2>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center sm:gap-7">
            {catTiles.map((c) => (
              <Link key={c.id} href={`${base}/shop?c=${c.slug}`} className="group flex w-[84px] shrink-0 flex-col items-center gap-2 sm:w-28">
                <span className="grid size-[84px] place-items-center overflow-hidden rounded-full bg-foreground/[.05] ring-1 ring-border transition group-hover:ring-foreground/40 sm:size-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.img ? <img src={c.img} alt="" className="size-full object-cover" /> : <span className="font-display text-xl font-bold text-muted">{c.name[0]}</span>}
                </span>
                <span className="w-full truncate text-center text-[12.5px] font-semibold">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto mt-12 max-w-7xl sm:mt-16 sm:px-6">
          <div className="flex items-end justify-between px-3 sm:px-0"><div><p className="text-[11px] font-bold tracking-[4px] text-muted">MOST LOVED</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Bestsellers</h2></div><Link href={`${base}/shop`} className="text-[13px] font-semibold text-muted hover:text-foreground">View all</Link></div>
          <div className="mt-5 flex snap-x gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:gap-x-5 sm:gap-y-8 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {featured.map((p) => <div key={p.id} className="w-[44vw] shrink-0 snap-start sm:w-auto"><ProductCard p={p} base={base} /></div>)}
          </div>
        </section>
      )}

      <section className="mx-auto mt-12 max-w-7xl px-3 sm:mt-16 sm:px-6">
        <div className="flex items-end justify-between"><div><p className="text-[11px] font-bold tracking-[4px] text-muted">JUST IN</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">New arrivals</h2></div><Link href={`${base}/shop`} className="text-[13px] font-semibold text-muted hover:text-foreground">Shop all</Link></div>
        {latest.length ? (
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{latest.map((p) => <ProductCard key={p.id} p={p} base={base} />)}</div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-muted">New products are coming soon.</p>
        )}
        {products.length > 12 && <div className="mt-10 text-center"><Link href={`${base}/shop`} className="inline-flex items-center gap-2 rounded-full border border-foreground px-7 py-3 text-[13px] font-bold tracking-wide uppercase">View all {products.length} products <ArrowRight className="size-4" /></Link></div>}
      </section>

      {reviews.length > 0 && (
        <section className="mt-16 overflow-hidden sm:mt-24">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="flex flex-col items-center text-center">
              <p className="text-[11px] font-bold tracking-[4px] text-muted">LOVED BY CUSTOMERS</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl">What people are saying</h2>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= Math.round(avg) ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-foreground/15"} />)}</span>
                <span><b className="text-foreground">{avg.toFixed(1)}</b> · {reviews.length} review{reviews.length > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          <div className="group relative mt-8 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className={`flex w-max gap-4 py-2 ${reviews.length > 1 ? "animate-[marquee_var(--d)_linear_infinite] group-hover:[animation-play-state:paused]" : "mx-auto"}`} style={{ ["--d" as string]: `${Math.max(25, reviews.length * 9)}s` }}>
              {(reviews.length > 1 ? [...reviews, ...reviews] : reviews).map((t, n) => (
                <figure key={`${t.id}-${n}`} aria-hidden={n >= reviews.length} className="relative flex w-[300px] shrink-0 flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,.02),0_12px_32px_-18px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1 hover:border-foreground/25 sm:w-[380px] sm:p-7">
                  <Quote className="absolute top-6 right-6 size-9 fill-foreground/[.04] text-foreground/[.08]" />
                  <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((k) => <Star key={k} className={k <= t.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-foreground/15"} />)}</span>
                  <blockquote className="mt-4 line-clamp-5 flex-1 font-display text-[16px] leading-relaxed text-foreground/90 sm:text-[17px]">“{t.text}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-dashed border-border pt-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-foreground to-foreground/70 text-sm font-bold text-background">{t.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold capitalize">{t.name}</span><span className="block truncate text-xs text-muted">{t.place || "Happy customer"}</span></span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {s.about && (
        <section className="mx-auto mt-16 max-w-7xl px-3 sm:mt-24 sm:px-6">
          <div className="rounded-3xl bg-foreground/[.03] px-6 py-12 text-center sm:px-16 sm:py-20">
            <p className="text-[11px] font-bold tracking-[4px] text-muted">OUR STORY</p>
            <p className="mx-auto mt-5 line-clamp-5 max-w-3xl font-display text-xl leading-relaxed sm:text-[1.7rem] sm:leading-snug">{s.about}</p>
            <Link href={`${base}/about`} className="mt-7 inline-block text-[13px] font-bold tracking-wide uppercase underline underline-offset-[6px]">Read more</Link>
          </div>
        </section>
      )}
    </>
  );
}
