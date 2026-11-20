import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getStoreByHandle, imgUrl } from "@/lib/server/catalog";
import { HIGHLIGHT_ICON_MAP } from "@/components/catalog/highlight-icons";

export const metadata: Metadata = { title: "About" };
export const revalidate = 120;

/** Our story — layout adapts to 0, 1 or 2 photos the merchant adds in Seller → Storefront. */
export default async function About({ params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const base = `/catalog/@${s.handle}`;
  const imgs = s.storefront.about.images.map((k) => imgUrl(k)).filter(Boolean) as string[];
  const heading = s.storefront.about.heading || s.tagline || `The story of ${s.name}`;
  const paras = (s.about || "We're a small, passionate team bringing you pieces we truly love. Every order is packed with care — thank you for supporting us!").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const perks = s.storefront.highlights.filter((h) => h.on && h.title).slice(0, 4);

  const Story = ({ center = false }: { center?: boolean }) => (
    <div className={center ? "mx-auto max-w-2xl text-center" : ""}>
      <p className={`text-[17px] leading-relaxed text-foreground/85 sm:text-lg ${center ? "" : "first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[4.2rem] first-letter:leading-[.8] first-letter:font-extrabold"}`}>{paras[0]}</p>
      {paras.slice(1).map((p, i) => <p key={i} className="mt-5 text-[16px] leading-relaxed whitespace-pre-line text-foreground/75">{p}</p>)}
    </div>
  );

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-6 sm:pt-16">
        <p className="text-[11px] font-bold tracking-[5px] text-muted">OUR STORY</p>
        <h1 className="mt-4 max-w-4xl font-display text-[2.3rem] leading-[1.04] font-extrabold tracking-tight sm:text-6xl">{heading}</h1>
        <p className="mt-4 text-sm font-semibold text-muted">— {s.name}</p>
      </section>

      {imgs.length === 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-5 sm:px-6">
          <div className="rounded-3xl bg-foreground/[.03] px-6 py-12 sm:px-16 sm:py-20"><Story center /></div>
        </section>
      )}

      {imgs.length === 1 && (
        <section className="mx-auto mt-10 grid max-w-6xl items-center gap-10 px-5 sm:mt-14 sm:px-6 md:grid-cols-2 md:gap-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[0]} alt={s.name} className="aspect-[4/5] w-full rounded-3xl object-cover" />
          <Story />
        </section>
      )}

      {imgs.length === 2 && (
        <section className="mx-auto mt-10 grid max-w-6xl items-center gap-12 px-5 sm:mt-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <div className="relative pr-[22%] pb-[18%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgs[0]} alt={s.name} className="aspect-[4/5] w-full rounded-3xl object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgs[1]} alt="" className="absolute right-0 bottom-0 aspect-square w-[46%] rounded-3xl border-[6px] border-background object-cover shadow-2xl" />
          </div>
          <Story />
        </section>
      )}

      {perks.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-5 sm:mt-24 sm:px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-4">
            {perks.map((h) => { const I = HIGHLIGHT_ICON_MAP[h.icon]; return (
              <div key={h.title} className="bg-background p-5 sm:p-7"><I className="size-6 text-foreground/70" /><p className="mt-4 font-display text-[15px] font-bold">{h.title}</p>{h.sub && <p className="mt-1 text-[13px] text-muted">{h.sub}</p>}</div>
            ); })}
          </div>
        </section>
      )}

      <section className="mx-auto mt-16 max-w-6xl px-5 sm:mt-24 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#0b0d12] px-7 py-10 text-white sm:flex-row sm:items-center sm:px-12 sm:py-14">
          <div><p className="text-[11px] font-bold tracking-[4px] text-white/50">COME SAY HELLO</p><p className="mt-2 max-w-md font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Find something you&apos;ll love.</p></div>
          <div className="flex flex-wrap gap-3">
            <Link href={`${base}/shop`} className="inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3 text-[13px] font-bold tracking-wide text-black uppercase">Shop now <ArrowRight className="size-4" /></Link>
            <Link href={`${base}/contact`} className="inline-flex items-center rounded-pill border border-white/20 px-6 py-3 text-[13px] font-bold tracking-wide uppercase">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
