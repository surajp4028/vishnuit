import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Quote, Star, Sparkles } from "lucide-react";
import {
  SiNextdotjs, SiReact, SiNodedotjs, SiTypescript, SiTailwindcss, SiMysql, SiWordpress, SiShopify, SiWoocommerce, SiFigma,
  SiGoogleads, SiMeta, SiRazorpay, SiMongodb, SiPhp, SiGoogleanalytics, SiVercel, SiFramer, SiGoogletagmanager, SiSemrush,
  SiElementor, SiGooglesearchconsole,
} from "react-icons/si";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Meteors } from "@/components/ui/meteors";
import { PlanCheckout } from "@/components/site/plan-checkout";
import { ScrollProcess } from "@/components/sections/premium";
import { CategoryVisual, hasVisual } from "@/components/visuals";
import type { BrandT, PlanT, PostT, ProjectT, ServiceT, TestimonialT } from "@/lib/server/content";

/* ---------------- Tech & partner marquee ---------------- */
const TECH = [
  [SiNextdotjs, "Next.js"], [SiReact, "React"], [SiNodedotjs, "Node.js"], [SiTypescript, "TypeScript"], [SiTailwindcss, "Tailwind"],
  [SiMysql, "MySQL"], [SiMongodb, "MongoDB"], [SiPhp, "PHP"], [SiWordpress, "WordPress"], [SiWoocommerce, "WooCommerce"],
  [SiShopify, "Shopify"], [SiElementor, "Elementor"], [SiFigma, "Figma"], [SiFramer, "Framer"], [SiRazorpay, "Razorpay"],
  [SiGoogleads, "Google Ads"], [SiMeta, "Meta Ads"], [SiGoogleanalytics, "GA4"], [SiGoogletagmanager, "GTM"],
  [SiGooglesearchconsole, "Search Console"], [SiSemrush, "Semrush"], [SiVercel, "Vercel"],
] as const;

export function TechMarquee({ brands }: { brands: BrandT[] }) {
  return (
    <section className="relative py-10 md:py-14">
      <p className="mb-8 text-center text-xs font-semibold tracking-[0.2em] text-muted uppercase">Recognised by & built with the best</p>
      {brands.length > 0 && (
        <div className="container-x mb-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {brands.map((b) => (
            <div key={b.id} className="relative h-10 w-28 opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 dark:invert-[.85] dark:hover:invert-0">
              <Image src={b.logo} alt={b.name} fill sizes="112px" className="object-contain" />
            </div>
          ))}
        </div>
      )}
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...TECH, ...TECH].map(([I, name], i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium whitespace-nowrap text-foreground/80">
              <I className="size-4" /> {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services ---------------- */
const CAT_META: Record<string, { blurb: string; gradient: string; icon: string }> = {
  Development: { blurb: "Next.js, React, WordPress, e-commerce & custom web apps engineered for speed.", gradient: "from-sky-500/20 via-indigo-500/10", icon: "Code2" },
  Design: { blurb: "Brand identities, UI/UX and print that make you unforgettable.", gradient: "from-fuchsia-500/20 via-rose-500/10", icon: "Palette" },
  "Digital Marketing": { blurb: "Social, Google & Meta Ads and content that bring leads every day.", gradient: "from-amber-500/25 via-orange-500/10", icon: "Megaphone" },
  SEO: { blurb: "White-hat on-page, off-page & technical SEO that ranks and converts.", gradient: "from-emerald-500/20 via-teal-500/10", icon: "Search" },
};

export function ServicesBento({ services }: { services: ServiceT[] }) {
  const cats = Object.keys(CAT_META);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {cats.map((c, i) => {
        const list = services.filter((s) => s.category === c);
        const m = CAT_META[c];
        return (
          <div key={c} className={cn("relative rounded-[1.75rem] border border-border p-1.5", i === 0 || i === 3 ? "lg:col-span-4" : "lg:col-span-2")}>
            <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-card p-6 md:p-8">
              <div className={cn("pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-gradient-to-br to-transparent blur-2xl", m.gradient)} />
              <div className="relative flex items-start justify-between gap-4">
                <div className="grid size-12 place-items-center rounded-2xl border border-border bg-background text-accent shadow-sm">
                  <Icon name={m.icon} className="size-5" />
                </div>
                <span className="font-display text-5xl font-extrabold text-foreground/[0.06]">0{i + 1}</span>
              </div>
              <h3 className="relative mt-6 font-display text-2xl font-bold">{c}</h3>
              <p className="relative mt-2 max-w-md text-sm text-muted">{m.blurb}</p>
              <div className="relative mt-6 flex flex-wrap gap-2">
                {list.map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}`} className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium transition hover:border-accent hover:text-accent">
                    <Icon name={s.icon} className="size-3.5" />
                    {s.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ServiceCard({ s }: { s: ServiceT }) {
  return (
    <Link href={`/services/${s.slug}`} className="group relative block h-full rounded-[1.5rem] border border-border p-1">
      <GlowingEffect spread={36} glow disabled={false} proximity={56} inactiveZone={0.01} borderWidth={2} />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-card p-6 transition-colors">
        {hasVisual(s.category) && !/^\/(uploads|media)\//.test(s.image ?? "") ? (
          <div className="relative -mx-6 -mt-6 mb-5 aspect-[16/9] overflow-hidden border-b border-border">
            <div className="absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50"><CategoryVisual category={s.category} slug={s.slug} /></div>
          </div>
        ) : s.image && (
          <div className="relative -mx-6 -mt-6 mb-5 aspect-[16/9] overflow-hidden border-b border-border">
            <Image src={s.image} alt={s.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover object-top transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-accent/15 to-accent-2/10 text-accent">
            <Icon name={s.icon} className="size-5" />
          </div>
          <ArrowUpRight className="size-5 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
        </div>
        <p className="mt-5 text-[11px] font-semibold tracking-widest text-accent uppercase">{s.category}</p>
        <h3 className="mt-1.5 font-display text-lg font-bold">{s.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.short}</p>
        <ul className="mt-4 space-y-1.5">
          {s.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-foreground/75"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />{f}</li>
          ))}
        </ul>
      </div>
    </Link>
  );
}

/* ---------------- Projects ---------------- */
const GRADS = ["from-amber-500 to-rose-500", "from-indigo-500 to-sky-500", "from-emerald-500 to-teal-600", "from-fuchsia-500 to-purple-600", "from-orange-500 to-amber-600"];

export function ProjectCover({ p, sizes, priority, className }: { p: ProjectT; sizes: string; priority?: boolean; className?: string }) {
  if (p.cover) return <Image src={p.cover} alt={p.title} fill sizes={sizes} priority={priority} className={cn("object-cover object-top transition duration-700 group-hover:scale-[1.04]", className)} />;
  return (
    <div className={cn("absolute inset-0 grid place-items-center bg-gradient-to-br p-6 text-center text-white", GRADS[p.id % GRADS.length])}>
      <div>
        <Sparkles className="mx-auto mb-3 size-8 opacity-80" />
        <p className="font-display text-2xl font-bold">{p.title}</p>
        <p className="mt-1 text-sm opacity-80">{p.tagline}</p>
      </div>
    </div>
  );
}

export function ProjectCard({ p, large }: { p: ProjectT; large?: boolean }) {
  return (
    <Link href={`/portfolio/${p.slug}`} className="group block">
      <div className={cn("relative overflow-hidden rounded-[1.5rem] border border-border bg-card", large ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <ProjectCover p={p} sizes={large ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 100vw, 33vw"} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">{p.category}</span>
          {p.year && <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-black backdrop-blur">{p.year}</span>}
        </div>
        <div className="absolute right-4 bottom-4 grid size-11 translate-y-3 place-items-center rounded-full bg-white text-black opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4 px-1">
        <div>
          <h3 className="font-display text-lg font-bold transition-colors group-hover:text-accent md:text-xl">{p.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{p.tagline}</p>
        </div>
      </div>
      {p.tools.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 px-1">
          {p.tools.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-foreground/5 px-2 py-0.5 text-[11px] text-muted">{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

/* ---------------- Process ---------------- */
const PROCESS = [
  ["Discovery call", "We understand your business, goals, audience and vision in a free consultation."],
  ["Research & strategy", "Competitor, market and keyword analysis turned into a tailored roadmap."],
  ["Design & build", "Pixel-perfect UI, clean code and content — reviewed with you at every milestone."],
  ["Launch", "Rigorous QA, speed & SEO checks, then a smooth go-live with training."],
  ["Grow & optimise", "Analytics, reporting and continuous improvement to compound your results."],
];

export function ProcessSteps({ title, highlight, subtitle }: { title?: string; highlight?: string; subtitle?: string } = {}) {
  return <ScrollProcess steps={PROCESS.map(([t, d]) => ({ title: t, text: d }))} title={title} highlight={highlight} subtitle={subtitle} />;
}

/* ---------------- Pricing ---------------- */
export function PricingCards({ plans }: { plans: PlanT[] }) {
  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-3">
      {plans.map((p) => (
        <div
          key={p.id}
          className={cn(
            "relative flex flex-col overflow-hidden rounded-[2rem] border p-8 transition hover:-translate-y-1",
            p.highlighted
              ? "border-transparent bg-[#0a0f1f] text-white shadow-[0_30px_80px_-30px_rgba(29,78,216,0.6)] ring-1 ring-accent/60 dark:bg-gradient-to-b dark:from-[#0f1a33] dark:to-[#0e0e12]"
              : "border-border bg-card",
          )}
        >
          {p.highlighted && (
            <>
              <div className="pointer-events-none absolute inset-0 overflow-hidden"><Meteors number={14} /></div>
              <div className="pointer-events-none absolute -top-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/40 blur-3xl" />
              <span className="absolute top-6 right-6 rounded-full bg-gradient-to-r from-[#d4a017] to-[#f5c542] px-3 py-1 text-xs font-bold text-black">Most popular</span>
            </>
          )}
          <h3 className="relative font-display text-xl font-bold">{p.name}</h3>
          <p className={cn("relative mt-2 text-sm", p.highlighted ? "text-white/65" : "text-muted")}>{p.tagline}</p>
          <div className="relative mt-7 flex items-end gap-1.5">
            <span className="font-display text-5xl font-extrabold tracking-tight">{formatINR(p.price)}</span>
            <span className={cn("mb-1.5 text-sm font-medium", p.highlighted ? "text-white/60" : "text-muted")}>{p.suffix}</span>
          </div>
          <p className={cn("relative mt-1 text-xs", p.highlighted ? "text-white/50" : "text-muted")}>One-time project fee · Pay securely online</p>
          <ul className="relative mt-8 flex-1 space-y-3.5">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", p.highlighted ? "bg-[#f5c542] text-black" : "bg-accent/10 text-accent")}>
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className={p.highlighted ? "text-white/85" : "text-foreground/80"}>{f}</span>
              </li>
            ))}
          </ul>
          <PlanCheckout plan={{ id: p.id, name: p.name, price: p.price, cta: p.cta }} highlighted={p.highlighted} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Testimonials ---------------- */
function TCard({ t }: { t: TestimonialT }) {
  return (
    <figure className="relative w-[320px] shrink-0 rounded-3xl border border-border bg-card p-6 md:w-[380px]">
      <Quote className="absolute top-5 right-5 size-8 text-accent/15" />
      <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("size-3.5", i < t.rating ? "fill-current" : "opacity-30")} />)}
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-foreground/85">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        {t.avatar ? <Image src={t.avatar} alt={t.name} width={40} height={40} className="size-10 rounded-full object-cover" /> : <span className="grid size-10 place-items-center rounded-full bg-accent/15 font-bold text-accent">{t.name[0]}</span>}
        <div>
          <p className="text-sm font-semibold">{t.name}</p>
          <p className="text-xs text-muted">{t.role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

export function TestimonialsMarquee({ items }: { items: TestimonialT[] }) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];
  return (
    <div className="space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      {rows.map((row, r) => (
        <div key={r} className="overflow-hidden">
          <div
            className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]"
            style={{ animationDirection: r ? "reverse" : "normal", animationDuration: "60s" }}
          >
            {[...row, ...row].map((t, i) => <TCard key={`${t.id}-${i}`} t={t} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Blog ---------------- */
export function PostCard({ p }: { p: PostT }) {
  return (
    <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        {p.cover && <Image src={p.cover} alt={p.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />}
        <span className="absolute top-4 left-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">{p.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs text-muted">{formatDate(p.published_at)}</p>
        <h3 className="mt-2 font-display text-lg leading-snug font-bold transition-colors group-hover:text-accent">{p.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{p.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">Read article <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

/* ---------------- CTA ---------------- */
export function CtaBanner({ title = "Ready to build something", highlight = "extraordinary?", subtitle = "Get a free consultation and a custom proposal within 24 hours. No obligations — just clarity.", whatsapp }: { title?: string; highlight?: string; subtitle?: string; whatsapp?: string }) {
  return (
    <section className="container-x py-16 md:py-24">
      <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-[#0a0f1f] px-6 py-16 text-center text-white md:px-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(59,130,246,0.45),transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><Meteors number={18} /></div>
        <h2 className="mx-auto max-w-3xl font-display text-3xl leading-tight font-bold text-balance sm:text-5xl md:text-6xl">
          {title} <span className="font-serif font-normal italic text-[#f5c542]">{highlight}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/65 md:text-lg">{subtitle}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d4a017] to-[#f5c542] px-7 py-3.5 text-sm font-bold text-black transition hover:scale-[1.03] sm:w-auto">
            Start your project <ArrowRight className="size-4" />
          </Link>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold transition hover:bg-white/10 sm:w-auto">
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Page header ---------------- */
export function PageHeader({ eyebrow, title, highlight, subtitle, children }: { eyebrow: string; title: string; highlight?: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden pt-36 pb-14 md:pt-44 md:pb-20">
            <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.12),transparent)] blur-2xl" />
      <div className="container-x text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">
          <span className="size-1.5 rounded-full bg-accent" /> {eyebrow}
        </span>
        <h1 className="mx-auto max-w-4xl font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
          {title} {highlight && <span className="font-serif font-normal italic text-gradient">{highlight}</span>}
        </h1>
        {subtitle && <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-muted md:text-lg">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
