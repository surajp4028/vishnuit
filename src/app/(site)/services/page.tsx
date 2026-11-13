import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, ServiceCard, ProcessSteps } from "@/components/sections/blocks";
import { SectionHeading } from "@/components/section-heading";
import { CheckList } from "@/components/sections/premium";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { CATEGORY_EXTRAS } from "@/data/service-extras";
import { CategoryVisual, hasVisual } from "@/components/visuals";
import { getServices, getSettings } from "@/lib/server/content";
import { cn } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Services — Web Development, SEO, Digital Marketing & Design",
  description: "Explore Vishnu IT's services: custom web & app development, WordPress, e-commerce, SEO, Google & Meta Ads, social media marketing, branding and UI/UX design.",
  alternates: { canonical: "/services" },
};

const anchor = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([getServices(), getSettings()]);
  const cats = Object.values(CATEGORY_EXTRAS);
  return (
    <>
      <PageHeader eyebrow="Our services" title="Everything you need to" highlight="grow online" subtitle={`${services.length} services across development, design, marketing and SEO — delivered by one senior team, under one roof.`}>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
          {cats.map((c) => (
            <a key={c.key} href={`#${anchor(c.key)}`} className="group flex flex-col items-center gap-2 rounded-3xl border border-border bg-card p-4 transition hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg">
              <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white"><Icon name={c.icon} className="size-5" /></span>
              <span className="text-sm font-semibold">{c.key}</span>
              <span className="text-xs text-muted">{services.filter((s) => s.category === c.key).length} services</span>
            </a>
          ))}
        </div>
      </PageHeader>

      {cats.map((c, idx) => {
        const list = services.filter((s) => s.category === c.key);
        if (!list.length) return null;
        const flip = idx % 2 === 1;
        return (
          <section key={c.key} id={anchor(c.key)} className={cn("scroll-mt-24 py-20 md:py-28", idx % 2 === 1 && "bg-[#f6f8fc] dark:bg-white/[0.02]")}>
            <div className="container-x">
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <Reveal className={cn("min-w-0", flip && "lg:order-2")}>
                  <div className="relative">
                    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-[#0a0f1f] p-2 shadow-[0_50px_120px_-50px_rgba(10,15,31,0.6)]">
                      <div className="flex items-center gap-1.5 px-3 py-2"><span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /></div>
                      <div className={cn("relative overflow-hidden rounded-[1.4rem]", hasVisual(c.key) ? "aspect-[4/5] sm:aspect-[4/3]" : "aspect-[4/3]")}>
                        {hasVisual(c.key) ? <CategoryVisual category={c.key} /> : <Image src={c.image} alt={c.imageAlt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover object-top" />}
                      </div>
                    </div>
                    <div className={cn("absolute -bottom-6 grid grid-cols-2 gap-2", flip ? "-right-3 md:-right-6" : "-left-3 md:-left-6")}>
                      {c.results.slice(0, 2).map((r) => (
                        <div key={r.label} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-xl">
                          <p className="font-display text-2xl font-extrabold text-accent">{r.value}</p>
                          <p className="text-[11px] text-muted">{r.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-foreground text-background"><Icon name={c.icon} className="size-5" /></span>
                    <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">0{idx + 1} · {c.eyebrow}</span>
                  </div>
                  <h2 className="mt-5 font-display text-3xl leading-[1.08] font-bold tracking-tight md:text-5xl">
                    {c.headline} <span className="font-serif font-normal italic text-gradient">{c.highlight}</span>
                  </h2>
                  <p className="mt-5 text-muted md:text-lg">{c.intro}</p>
                  <div className="mt-7"><CheckList items={c.deliverables.slice(0, 6)} /></div>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {c.tools.slice(0, 8).map((t) => <span key={t} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">{t}</span>)}
                  </div>
                  <Link href={`/services/${list[0].slug}`} className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">
                    Explore {c.key.toLowerCase()} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
              <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((s, i) => <Reveal key={s.slug} delay={i * 0.04}><ServiceCard s={s} /></Reveal>)}
              </div>
            </div>
          </section>
        );
      })}

      <section className="container-x py-20 md:py-28">
        <ProcessSteps />
      </section>
    </>
  );
}
