import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Check, Clock, Download, Phone, ShieldCheck, Star, X, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { PricingCards, TechMarquee, TestimonialsMarquee } from "@/components/sections/blocks";
import { FaqAccordion, Stats } from "@/components/sections/interactive";
import { ScrollProcess } from "@/components/sections/premium";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { LeadForm } from "@/components/lp/lead-form";
import { ScrollToFormButton } from "@/components/lp/chrome";
import { LANDING_PAGES, getLandingPage } from "@/data/landing-pages";
import { getBrands, getPlans, getSettings, getTestimonials } from "@/lib/server/content";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_PAGES.map((p) => ({ lp: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ lp: string }> }): Promise<Metadata> {
  const p = getLandingPage((await params).lp);
  if (!p) return {};
  return { title: { absolute: p.metaTitle }, description: p.metaDescription, alternates: { canonical: `/${p.slug}` } };
}

const COMPARE: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Starting price", "₹9,999", "₹5k–15k", "₹1L+"],
  ["Premium custom design", true, false, true],
  ["Live in 7 days", true, false, false],
  ["Admin panel to edit yourself", true, false, true],
  ["SEO & speed optimised", true, false, true],
  ["Meta Pixel & lead tracking", true, false, true],
  ["Pay 50% after approval", true, false, false],
  ["Support after launch", true, false, true],
];

const cell = (v: boolean | string, hl?: boolean) =>
  v === true ? <Check className={`mx-auto size-5 ${hl ? "text-[#f5c542]" : "text-emerald-500"}`} strokeWidth={3} /> : v === false ? <X className="mx-auto size-5 text-red-400/70" /> : <span className="font-semibold">{v}</span>;

export default async function LandingPage({ params }: { params: Promise<{ lp: string }> }) {
  const p = getLandingPage((await params).lp);
  if (!p) notFound();
  const [settings, plans, testimonials, brands] = await Promise.all([getSettings(), getPlans(), getTestimonials(), getBrands()]);
  const { contact, founder } = settings;
  const tel = contact.phone.replace(/\s/g, "");
  const wa = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Hi Vishnu IT, I want a website. Please share details.")}`;

  return (
    <>
      {/* ===== HERO + FORM ===== */}
      <section id="top" className="relative isolate overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="pointer-events-none absolute -top-40 left-1/4 -z-10 h-[560px] w-[1000px] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.16),transparent)] blur-2xl" />
        <div className="pointer-events-none absolute top-40 right-0 -z-10 size-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,0.14),transparent)] blur-2xl" />
        <div className="container-x grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-7 lg:pt-6">
            <span className="inline-flex max-w-full items-center rounded-full border border-[#d4a017]/40 bg-[#d4a017]/10 px-3.5 py-1.5 text-xs font-semibold text-[#8a6a0c] sm:text-sm dark:text-[#f5c542]">{p.badge}</span>
            <h1 className="mt-5 font-display text-[2.35rem] leading-[1.04] font-extrabold tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.9rem]">
              {p.headline} <span className="font-serif font-normal italic text-gradient">{p.highlight}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-pretty text-muted md:text-lg">{p.subheadline}</p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm font-medium md:text-[15px]">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-3" strokeWidth={4} /></span>{b}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex -space-x-2.5">
                {testimonials.slice(0, 5).map((t) => t.avatar && <Image key={t.id} src={t.avatar} alt="" width={36} height={36} className="size-9 rounded-full border-2 border-background object-cover" />)}
              </div>
              <div className="text-sm">
                <p className="flex items-center gap-1 font-semibold"><span className="flex text-amber-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</span> 4.9/5</p>
                <p className="text-muted">150+ websites delivered · 120+ happy clients</p>
              </div>
            </div>
            <div className="mt-7 hidden gap-3 sm:flex">
              <a href={`tel:${tel}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-bold hover:border-[#1d4ed8]"><Phone className="size-4 text-[#1d4ed8]" /> {contact.phone}</a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white"><FaWhatsapp className="size-4" /> Chat on WhatsApp</a>
            </div>
          </div>

          <div id="get-quote" className="min-w-0 scroll-mt-28 lg:col-span-5">
            <div className="relative rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_40px_100px_-40px_rgba(10,15,31,0.45)] sm:p-7">
              <div className="absolute -top-3 left-6 rounded-full bg-[#0a0f1f] px-3 py-1 text-[11px] font-bold tracking-wide text-[#f5c542] uppercase dark:bg-white dark:text-[#0a0f1f]">Free consultation</div>
              <h2 className="font-display text-2xl font-extrabold">{p.formTitle}</h2>
              <p className="mt-1 mb-5 text-sm text-muted">{p.formSubtitle}</p>
              <LeadForm services={p.serviceOptions} />
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center text-[11px] text-muted">
                <p><Clock className="mx-auto mb-1 size-4 text-[#1d4ed8]" />30-min reply</p>
                <p><ShieldCheck className="mx-auto mb-1 size-4 text-emerald-600" />No spam calls</p>
                <p><BadgeCheck className="mx-auto mb-1 size-4 text-[#d4a017]" />Fixed pricing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TechMarquee brands={brands.filter((b) => b.kind === "partner")} />
      <section className="container-x pt-4">
        <Reveal><Stats stats={settings.stats} /></Reveal>
      </section>

      {/* ===== PROBLEM ===== */}
      <section className="container-x py-16 md:py-24">
        <SectionHeading eyebrow="Sound familiar?" title="Your business deserves more than" highlight="a pretty page" subtitle="Most small-business websites lose customers every single day. Here's why." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.pains.map((x, i) => (
            <Reveal key={x.title} delay={i * 0.06}>
              <div className="h-full rounded-3xl border border-red-500/15 bg-red-500/[0.03] p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-red-500/10 text-red-500"><X className="size-5" /></span>
                <h3 className="mt-4 font-display text-lg font-bold">{x.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{x.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl bg-[#0a0f1f] p-6 text-white md:flex-row md:p-8">
          <p className="text-center font-display text-xl font-bold md:text-left md:text-2xl">We fix all of this — with a website built to <span className="text-[#f5c542]">sell</span>, not just sit there.</p>
          <ScrollToFormButton className="shrink-0 rounded-full bg-gradient-to-r from-[#d4a017] to-[#f5c542] px-6 py-3 text-sm font-extrabold text-[#0a0f1f]">Get my free quote →</ScrollToFormButton>
        </div>
      </section>

      {/* ===== OFFERINGS ===== */}
      <section className="relative isolate overflow-hidden bg-[#05070d] py-16 text-white md:py-24">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.3),transparent)] blur-2xl" />
        <div className="container-x">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-[#f5c542] uppercase">Everything included</span>
            <h2 className="mt-5 font-display text-3xl leading-tight font-bold md:text-5xl">What you get with <span className="font-serif font-normal italic text-[#f5c542]">Vishnu IT</span></h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {p.offerings.map((o, i) => (
              <Reveal key={o.title} delay={i * 0.04}>
                <div className="group h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.06]">
                  <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] shadow-lg shadow-blue-500/30 transition group-hover:scale-110"><Icon name={o.icon} className="size-5" /></span>
                  <h3 className="mt-4 font-display text-lg font-bold">{o.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{o.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PORTFOLIO ===== */}
      <section className="container-x py-16 md:py-24">
        <SectionHeading eyebrow="Our work" title="Real projects." highlight="Live right now." subtitle="Tap any project to see the full case study — screens, features and tech — then visit the live site." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {p.showcase.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <Link href={`/portfolio/${s.slug}`} className="group block overflow-hidden rounded-3xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[16/11] overflow-hidden">
                  <Image src={s.image} alt={s.title} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" className="object-cover object-top transition duration-700 group-hover:scale-105" />
                  <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white text-black opacity-0 shadow transition group-hover:opacity-100"><ArrowUpRight className="size-4" /></span>
                  <span className="absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-black/70 py-1.5 text-center text-xs font-semibold text-white opacity-0 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100">View case study →</span>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold tracking-wide text-[#1d4ed8] uppercase dark:text-[#60a5fa]">{s.tag}</p>
                  <h3 className="mt-1 font-display font-bold">{s.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Zap className="size-3.5 text-[#d4a017]" />{s.result}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== PACKAGES ===== */}
      <section className="bg-[#f6f8fc] py-16 md:py-24 dark:bg-white/[0.02]">
        <div className="container-x">
          <SectionHeading eyebrow="Packages" title="Simple pricing that fits" highlight="your budget" subtitle="Fixed prices, no hidden charges. Pay online to start instantly — or talk to us first." />
          <PricingCards plans={plans} />
          <p className="mt-6 text-center text-sm text-muted">💡 Not sure which plan? <ScrollToFormButton className="font-semibold text-[#1d4ed8] underline underline-offset-4">Get a free recommendation</ScrollToFormButton></p>
        </div>
      </section>

      {/* ===== PROCESS (scroll-driven) ===== */}
      <section className="container-x py-16 md:py-28">
        <ScrollProcess
          steps={p.steps.map((s) => ({ title: `${s.day} · ${s.title}`, text: s.text }))}
          eyebrow="How it works"
          title="From call to live website in"
          highlight="7 days"
          subtitle="No endless back-and-forth. A clear, fixed timeline — scroll to see exactly what happens each day."
        />
        <div className="mt-10 flex justify-center">
          <ScrollToFormButton className="rounded-full bg-[#0a0f1f] px-7 py-3.5 text-sm font-bold text-white shadow-lg dark:bg-white dark:text-[#0a0f1f]">Start my 7-day website →</ScrollToFormButton>
        </div>
      </section>

      {/* ===== COMPARISON ===== */}
      <section className="container-x pb-16 md:pb-24">
        <SectionHeading eyebrow="Compare" title="Why businesses choose" highlight="Vishnu IT" />
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left font-medium text-muted md:p-5" />
                <th className="bg-[#0a0f1f] p-4 font-display text-base font-extrabold text-white md:p-5">Vishnu IT ⭐</th>
                <th className="p-4 font-display font-bold text-muted md:p-5">Freelancer</th>
                <th className="p-4 font-display font-bold text-muted md:p-5">Big agency</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([k, a, b, c]) => (
                <tr key={k} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium md:p-5">{k}</td>
                  <td className="bg-[#0a0f1f] p-4 text-center text-white md:p-5">{cell(a, true)}</td>
                  <td className="p-4 text-center md:p-5">{cell(b)}</td>
                  <td className="p-4 text-center md:p-5">{cell(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="pb-16 md:pb-24">
        <div className="container-x"><SectionHeading eyebrow="Client love" title="Don't just take" highlight="our word" /></div>
        <TestimonialsMarquee items={testimonials} />
      </section>

      {/* ===== FOUNDER ===== */}
      <section className="container-x pb-16 md:pb-24">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-border bg-card p-5 md:p-10 lg:grid-cols-12">
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-[1.5rem] lg:col-span-4">
            <Image src={founder.photo} alt={founder.name} fill sizes="280px" className="object-cover" />
          </div>
          <div className="lg:col-span-8">
            <p className="text-xs font-bold tracking-widest text-[#1d4ed8] uppercase dark:text-[#60a5fa]">You work directly with the founder</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Hi, I&apos;m {founder.name} 👋</h2>
            <p className="mt-4 leading-relaxed text-muted md:text-lg">
              I&apos;m a fullstack developer with 4+ years of experience building payment-gateway onboarding platforms, travel and astrology apps, and 150+ business websites. No sales middlemen — your project is personally handled by me and my team, from the first call to launch.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <a href={founder.portfolio} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-2xl border border-border p-2 pr-4 transition hover:border-[#1d4ed8]">
                <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl"><Image src="/projects/suraj-portfolio-v1-hero.webp" alt="Suraj Pandey portfolio" fill sizes="96px" className="object-cover object-top" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold">See my personal portfolio</span><span className="block truncate text-xs text-muted">{founder.portfolio.replace(/^https?:\/\//, "")}</span></span>
                <ArrowUpRight className="size-4 text-muted group-hover:text-[#1d4ed8]" />
              </a>
              <a href={founder.cv} download className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-[#1d4ed8]"><Download className="size-4" /> CV</a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GUARANTEE ===== */}
      <section className="container-x pb-16 md:pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["💯", "Approve before you pay", "Pay 50% to start. The rest only after you approve the final website."],
            ["⚡", "7-day delivery", "A clear timeline from day one — Starter websites go live in a week."],
            ["🤝", "We don't disappear", "Free post-launch support, full source code and admin access are yours."],
          ].map(([e, t, d]) => (
            <div key={t} className="rounded-3xl border-2 border-dashed border-[#d4a017]/40 bg-[#d4a017]/[0.04] p-6 text-center">
              <p className="text-3xl">{e}</p>
              <h3 className="mt-3 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ + FINAL FORM ===== */}
      <section className="container-x grid gap-10 pb-20 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="FAQ" title="Questions?" highlight="Answered." />
          <FaqAccordion items={p.faqs.map((f, i) => ({ ...f, id: i + 1 }))} />
        </div>
        <div className="lg:pt-6">
          <div className="sticky top-24 overflow-hidden rounded-[1.75rem] bg-[#0a0f1f] p-5 text-white shadow-2xl sm:p-7">
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.5),transparent)]" />
            <p className="relative text-xs font-bold tracking-widest text-[#f5c542] uppercase">Limited slots this month</p>
            <h2 className="relative mt-2 font-display text-2xl font-extrabold md:text-3xl">Ready to get more customers online?</h2>
            <p className="relative mt-1 mb-5 text-sm text-white/65">Fill the form — we&apos;ll call you within 30 minutes (10 AM – 7 PM).</p>
            <div className="relative rounded-2xl bg-white p-4 sm:p-5 dark:bg-[#0b0f1a]">
              <LeadForm id="lead-form-bottom" services={p.serviceOptions} compact cta="Call me back now" />
            </div>
            <div className="relative mt-4 flex flex-wrap justify-center gap-3 text-sm">
              <a href={`tel:${tel}`} className="inline-flex items-center gap-2 font-semibold text-white/85 hover:text-white"><Phone className="size-4" /> {contact.phone}</a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-[#25D366]"><FaWhatsapp className="size-4" /> WhatsApp us</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
