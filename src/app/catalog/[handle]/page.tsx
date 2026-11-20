import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Testimonials } from "@/components/catalog/testimonials";
import { HeroCarousel } from "@/components/catalog/hero-carousel";
import { withChildren } from "@/lib/category-tree";
import { HIGHLIGHT_ICON_MAP } from "@/components/catalog/highlight-icons";
import { getStoreByHandle, getStoreCategories, getStoreProducts, imgUrl, storeBase } from "@/lib/server/catalog";
import { ProductCard } from "@/components/catalog/product-card";

export const revalidate = 120;

export default async function StoreHome({ params }: { params: Promise<{ handle: string }> }) {
  const raw = (await params).handle;
  const s = await getStoreByHandle(raw);
  if (!s) notFound();
  const base = storeBase(raw, s.handle);
  const [cats, products] = await Promise.all([getStoreCategories(s.id), getStoreProducts(s.id, { activeOnly: true, limit: 40 })]);
  // Small stores: one "Our collection" grid instead of Bestsellers + New arrivals repeating the same items.
  const small = products.length <= 8;
  const featured = small ? [] : products.filter((p) => p.featured).slice(0, 10);
  const latest = (small ? products : products.filter((p) => !p.featured).length >= 4 ? products.filter((p) => !p.featured) : products).slice(0, 8);
  const aboutImgs = s.storefront.about.images.map((k) => imgUrl(k)).filter(Boolean) as string[];
  const banner = imgUrl(s.banner_key);
  const catTiles = cats.filter((c) => !c.parent_id).map((c) => { const ids = withChildren(cats, c.id); return { ...c, img: imgUrl(products.find((p) => p.category_id != null && ids.includes(p.category_id) && p.images[0])?.images[0]) }; }).slice(0, 10);
  const perks = s.storefront.highlights.filter((h) => h.on && h.title).slice(0, 4);
  const slides = s.storefront.banners.map((x) => ({ ...x, url: imgUrl(x.key)! })).filter((x) => x.url);
  const reviews = s.testimonials.on ? s.testimonials.items.filter((t) => t.on) : [];

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
            <Link href={`${base}/shop`} className="mt-7 inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3 text-[13px] font-bold tracking-wide text-black uppercase transition hover:gap-3">Shop the collection <ArrowRight className="size-4" /></Link>
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
                <span className="min-w-0"><span className="block text-[12.5px] leading-tight font-semibold sm:text-[13.5px]">{x.title}</span>{x.sub && <span className="mt-0.5 block text-[11px] leading-tight text-muted sm:text-xs">{x.sub}</span>}</span>
              </div>
            ); })}
          </div>
        </section>
      )}

      {catTiles.length > 0 && (
        <section className="mx-auto mt-12 max-w-7xl sm:mt-16 sm:px-6">
          <div className="flex items-end justify-between px-3 sm:px-0"><div><p className="text-[11px] font-bold tracking-[4px] text-muted">EXPLORE</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Shop by category</h2></div><Link href={`${base}/shop`} className="text-[13px] font-semibold text-muted hover:text-foreground">See all</Link></div>
          <div className={`mt-5 flex snap-x scroll-px-3 gap-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:grid sm:gap-4 sm:overflow-visible sm:px-0 ${catTiles.length >= 5 ? "sm:grid-cols-5" : catTiles.length === 4 ? "sm:grid-cols-4" : catTiles.length === 3 ? "sm:grid-cols-3" : catTiles.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
            {catTiles.slice(0, 10).map((c) => (
              <Link key={c.id} href={`${base}/shop?c=${c.slug}`} className={`group relative block aspect-[3/4] w-[38vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-foreground/[.05] sm:w-auto ${catTiles.length <= 2 ? "sm:aspect-[16/9]" : catTiles.length === 3 ? "sm:aspect-[4/5]" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.img ? <img src={c.img} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" /> : <span className="absolute inset-0 grid place-items-center font-display text-5xl font-extrabold text-foreground/10">{c.name[0]}</span>}
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5"><span className={`block font-display text-[15px] leading-tight font-bold ${catTiles.length <= 3 ? "sm:text-3xl" : "sm:text-lg"}`}>{c.name}</span><span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-white/75 transition group-hover:gap-2">Shop now <ArrowRight className="size-3" /></span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto mt-12 max-w-7xl sm:mt-16 sm:px-6">
          <div className="flex items-end justify-between px-3 sm:px-0"><div><p className="text-[11px] font-bold tracking-[4px] text-muted">MOST LOVED</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Bestsellers</h2></div><Link href={`${base}/shop`} className="text-[13px] font-semibold text-muted hover:text-foreground">View all</Link></div>
          <div className="mt-5 flex snap-x scroll-px-3 gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:gap-x-5 sm:gap-y-8 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {featured.map((p) => <div key={p.id} className="w-[44vw] shrink-0 snap-start sm:w-auto"><ProductCard p={p} base={base} /></div>)}
          </div>
        </section>
      )}

      <section className="mx-auto mt-12 max-w-7xl px-3 sm:mt-16 sm:px-6">
        <div className="flex items-end justify-between"><div><p className="text-[11px] font-bold tracking-[4px] text-muted">{small ? "THE EDIT" : "JUST IN"}</p><h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{small ? "Our collection" : "New arrivals"}</h2></div><Link href={`${base}/shop`} className="text-[13px] font-semibold text-muted hover:text-foreground">Shop all</Link></div>
        {latest.length ? (
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{latest.map((p) => <ProductCard key={p.id} p={p} base={base} />)}</div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-muted">New products are coming soon.</p>
        )}
        {products.length > latest.length && <div className="mt-10 text-center"><Link href={`${base}/shop`} className="inline-flex items-center gap-2 rounded-pill border border-foreground px-7 py-3 text-[13px] font-bold tracking-wide uppercase">View all {products.length} products <ArrowRight className="size-4" /></Link></div>}
      </section>

      {reviews.length > 0 && <Testimonials reviews={reviews.map((t) => ({ id: t.id, name: t.name, place: t.place, text: t.text, rating: t.rating }))} />}

      {s.about && (
        <section className="mx-auto mt-16 max-w-7xl px-3 sm:mt-24 sm:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="relative">
              {aboutImgs.length >= 2 ? (
                <div className="relative pr-[20%] pb-[16%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aboutImgs[0]} alt={s.name} className="aspect-[4/5] w-full rounded-3xl object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aboutImgs[1]} alt="" className="absolute right-0 bottom-0 aspect-square w-[45%] rounded-2xl border-[6px] border-background object-cover shadow-2xl" />
                </div>
              ) : aboutImgs.length === 1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={aboutImgs[0]} alt={s.name} className="aspect-[4/5] w-full rounded-3xl object-cover" />
              ) : (
                <div className="relative isolate grid aspect-[4/5] place-items-center overflow-hidden rounded-3xl bg-[#0b0d12] text-white sm:aspect-[5/5]">
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_10%,rgba(212,160,23,.3),transparent_55%),radial-gradient(ellipse_at_80%_90%,rgba(59,130,246,.22),transparent_55%)]" />
                  <span className="font-display text-[10rem] leading-none font-extrabold text-white/90 sm:text-[13rem]">{s.name[0]}</span>
                  <span className="absolute bottom-6 text-[11px] font-bold tracking-[5px] text-white/50 uppercase">Est. {new Date(s.created_at).getFullYear()}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[4px] text-muted">OUR STORY</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl">{s.storefront.about.heading || s.tagline || `Meet ${s.name}`}</h2>
              <p className="mt-5 line-clamp-5 text-[16px] leading-relaxed text-foreground/75 sm:text-[17px]">{s.about.split(/\n\s*\n/)[0]}</p>
              {perks.length > 0 && (
                <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3">
                  {perks.slice(0, 4).map((h) => { const I = HIGHLIGHT_ICON_MAP[h.icon] ?? BadgeCheck; return <li key={h.title} className="flex items-center gap-2.5 text-[13.5px] font-semibold"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/[.06]"><I className="size-4" /></span>{h.title}</li>; })}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link href={`${base}/about`} className="inline-flex items-center gap-2 rounded-pill bg-foreground px-6 py-3.5 text-[13px] font-bold tracking-wide text-background uppercase transition hover:gap-3">Read our story <ArrowRight className="size-4" /></Link>
                <span className="font-display text-lg italic text-muted">— Team {s.name}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
