"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { CATEGORY_EXTRAS } from "@/data/service-extras";
import { CategoryVisual, hasVisual } from "@/components/visuals";

type Svc = { slug: string; title: string; category: string; icon: string; short: string };

/* ------------- Tabbed services showcase (home) ------------- */
export function ServicesShowcase({ services }: { services: Svc[] }) {
  const cats = Object.values(CATEGORY_EXTRAS);
  const [active, setActive] = useState(cats[0].key);
  const c = CATEGORY_EXTRAS[active];
  const list = services.filter((s) => s.category === active);
  return (
    <div className="rounded-[2.25rem] border border-border bg-card p-2 shadow-[0_40px_100px_-50px_rgba(10,15,31,0.35)] md:p-3">
      <div className="grid grid-cols-2 gap-1.5 rounded-[1.75rem] bg-foreground/[0.04] p-1.5 md:grid-cols-4">
        {cats.map((x) => (
          <button
            key={x.key}
            onClick={() => setActive(x.key)}
            className={cn("relative flex items-center justify-center gap-2 rounded-[1.4rem] px-3 py-3 text-sm font-semibold transition md:py-3.5", active === x.key ? "text-white" : "text-muted hover:text-foreground")}
          >
            {active === x.key && <motion.span layoutId="svc-tab" className="absolute inset-0 rounded-[1.4rem] bg-[#0a0f1f] shadow-lg dark:bg-accent" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
            <Icon name={x.icon} className="relative size-4" />
            <span className="relative">{x.key}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-8 p-4 md:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10"
        >
          <div className="flex min-w-0 flex-col">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{c.eyebrow}</p>
            <h3 className="mt-3 font-display text-3xl leading-[1.08] font-bold tracking-tight md:text-[2.6rem]">
              {c.headline} <span className="font-serif font-normal italic text-gradient">{c.highlight}</span>
            </h3>
            <p className="mt-4 text-muted md:text-lg">{c.intro}</p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {list.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`} className="group flex items-center gap-3 rounded-2xl border border-border bg-background px-3.5 py-3 transition hover:border-accent/50 hover:shadow-md">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white"><Icon name={s.icon} className="size-4" /></span>
                  <span className="flex-1 text-sm font-semibold">{s.title}</span>
                  <ArrowUpRight className="size-4 text-muted transition group-hover:text-accent" />
                </Link>
              ))}
            </div>
            <div className="mt-auto pt-8">
              <Link href={`/services#${active.toLowerCase().replace(/\s+/g, "-")}`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                Explore {active.toLowerCase()} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="relative min-w-0">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-[#0a0f1f] p-1.5 shadow-2xl">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5"><span className="size-2 rounded-full bg-red-400" /><span className="size-2 rounded-full bg-amber-400" /><span className="size-2 rounded-full bg-emerald-400" /></div>
              <div className={cn("relative overflow-hidden rounded-xl", hasVisual(active) ? "aspect-[4/5] sm:aspect-[16/11]" : "aspect-[16/11]")}>
                {hasVisual(active) ? <CategoryVisual category={active} /> : <Image src={c.image} alt={c.imageAlt} fill sizes="(max-width:1024px) 100vw, 45vw" className="object-cover object-top" />}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:absolute lg:-bottom-6 lg:-left-8 lg:mt-0 lg:grid-cols-2 lg:gap-2">
              {c.results.slice(0, 4).map((r, i) => (
                <div key={r.label} className={cn("rounded-2xl border border-border bg-card/95 p-3.5 shadow-lg backdrop-blur", i > 1 && "lg:hidden")}>
                  <p className="font-display text-2xl font-extrabold text-accent">{r.value}</p>
                  <p className="text-[11px] text-muted">{r.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------- Dark capabilities bento (home) ------------- */
const CAPS = [
  { title: "Fintech dashboards", text: "Maker-checker queues, KYC, PG integrations", img: "/projects/onboarding-dashboard-dark.webp", span: "md:col-span-2 md:row-span-2", href: "/portfolio/imoneypay-merchant-onboarding" },
  { title: "Travel booking", text: "Trains, flights, PNR & live status", img: "/projects/skyo-flights.webp", span: "", href: "/portfolio/skyo-travel" },
  { title: "Astrology platform", text: "Kundli, Milan & paid PDF reports", img: "/projects/kundli-milan.webp", span: "", href: "/portfolio/astro-kundli-milan" },
  { title: "Devotional community", text: "Darshan, events & admin CMS", img: "/projects/shiv-shringar-home.webp", span: "", href: "/portfolio/shiv-shringar-sewa-samiti" },
  { title: "Brand & print", text: "Hoardings, cards & identities", img: "/projects/brand-hoardings.webp", span: "", href: "/portfolio/brand-print-design" },
];

export function CapabilitiesBand() {
  return (
    <section className="relative isolate overflow-hidden bg-[#05070d] py-24 text-white md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.35),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 -z-10 size-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,0.18),transparent)] blur-2xl" />
      <div className="container-x">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-[#f5c542] uppercase"><span className="size-1.5 rounded-full bg-[#f5c542]" /> What we've built</span>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl">
            Real products. <span className="font-serif font-normal italic text-[#f5c542]">Real users.</span>
          </h2>
          <p className="mt-5 text-white/60 md:text-lg">Not templates — production platforms handling payments, bookings and thousands of users every day.</p>
        </div>
        <div className="grid auto-rows-[220px] gap-4 md:grid-cols-4 md:auto-rows-[240px]">
          {CAPS.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.6 }} className={c.span}>
              <Link href={c.href} className="group relative block size-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
                <Image src={c.img} alt={c.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover object-top opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
                  <div>
                    <p className="font-display text-lg font-bold md:text-xl">{c.title}</p>
                    <p className="text-sm text-white/65">{c.text}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black transition group-hover:rotate-45"><ArrowUpRight className="size-4" /></span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-4">
          {[["150+", "Websites delivered"], ["24", "Case studies"], ["4+", "Years shipping"], ["4.9★", "Client rating"]].map(([v, l]) => (
            <div key={l} className="bg-[#05070d] p-6 text-center md:p-8">
              <p className="font-display text-3xl font-extrabold md:text-5xl">{v}</p>
              <p className="mt-1 text-xs tracking-wide text-white/55 uppercase">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------- Benefits grid with spotlight hover ------------- */
export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const [pos, setPos] = useState({ x: 0, y: 0, o: 0 });
  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top, o: 1 });
      }}
      onMouseLeave={() => setPos((p) => ({ ...p, o: 0 }))}
      className={cn("relative overflow-hidden rounded-[1.75rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl", className)}
    >
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={{ opacity: pos.o, background: `radial-gradient(380px circle at ${pos.x}px ${pos.y}px, rgba(59,130,246,0.12), transparent 60%)` }} />
      <div className="relative">{children}</div>
    </div>
  );
}

export function CheckList({ items, cols = 2 }: { items: string[]; cols?: number }) {
  return (
    <ul className={cn("grid gap-3", cols === 2 && "sm:grid-cols-2")}>
      {items.map((d) => (
        <li key={d} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-600"><Check className="size-3" strokeWidth={3} /></span>
          <span>{d}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------- Scroll-driven process timeline ------------- */

function ProcessItem({ i, title, text, total }: { i: number; title: string; text?: string; total: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  const seen = useInView(ref, { once: true, margin: "-15% 0px" });
  return (
    <li ref={ref} className="relative pb-10 pl-16 last:pb-0 md:pb-14 md:pl-24">
      <motion.span
        animate={{ scale: inView ? 1.08 : 1 }}
        className={cn(
          "absolute top-0 left-0 grid size-12 place-items-center rounded-2xl border font-display text-base font-bold transition-colors duration-500 md:left-3 md:size-14 md:text-lg",
          seen ? "border-transparent bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white shadow-lg shadow-blue-500/30" : "border-border bg-card text-muted",
        )}
      >
        {String(i + 1).padStart(2, "0")}
      </motion.span>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={seen ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn("rounded-3xl border bg-card p-6 transition-all duration-500 md:p-8", inView ? "border-accent/40 shadow-[0_20px_60px_-30px_rgba(29,78,216,0.45)]" : "border-border")}
      >
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">Step {i + 1} of {total}</p>
        <h3 className="mt-2 font-display text-xl font-bold md:text-2xl">{title}</h3>
        {text && <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">{text}</p>}
      </motion.div>
    </li>
  );
}

export function ScrollProcess({ steps, eyebrow = "Our process", title = "From concept to", highlight = "completion", subtitle }: { steps: { title: string; text?: string }[]; eyebrow?: string; title?: string; highlight?: string; subtitle?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 60%", "end 60%"] });
  const h = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase"><span className="size-1.5 rounded-full bg-accent" />{eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl leading-[1.1] font-bold tracking-tight md:text-5xl">{title} <span className="font-serif font-normal italic text-gradient">{highlight}</span></h2>
          <p className="mt-4 text-muted md:text-lg">{subtitle ?? "A transparent, step-by-step process that keeps you in control and your project on schedule."}</p>
          <div className="mt-8 hidden h-1.5 w-full overflow-hidden rounded-full bg-foreground/5 lg:block">
            <motion.div style={{ width: h }} className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#d4a017]" />
          </div>
        </div>
      </div>
      <div ref={ref} className="relative lg:col-span-8">
        <div className="absolute top-2 bottom-2 left-6 w-px bg-border md:left-10" />
        <motion.div style={{ height: h }} className="absolute top-2 left-6 w-px bg-gradient-to-b from-[#1d4ed8] via-[#3b82f6] to-[#d4a017] md:left-10" />
        <ol className="relative">
          {steps.map((s, i) => <ProcessItem key={s.title} i={i} title={s.title} text={s.text} total={steps.length} />)}
        </ol>
      </div>
    </div>
  );
}
