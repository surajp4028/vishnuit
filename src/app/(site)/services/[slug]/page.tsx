import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarClock, ChevronRight, IndianRupee, Phone, Star, Users } from "lucide-react";
import { ServiceCard, ProjectCard, PricingCards, TestimonialsMarquee } from "@/components/sections/blocks";
import { SectionHeading } from "@/components/section-heading";
import { FaqAccordion } from "@/components/sections/interactive";
import { CheckList, ScrollProcess, SpotlightCard } from "@/components/sections/premium";
import { ContactForm } from "@/components/site/contact-form";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { CATEGORY_EXTRAS } from "@/data/service-extras";
import { SERVICE_DETAILS } from "@/data/service-details";
import { CategoryVisual, MarketingVisual, SeoVisual, hasVisual } from "@/components/visuals";
import { getFaqs, getPlans, getProjects, getService, getServices, getSettings, getTestimonials } from "@/lib/server/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getService((await params).slug);
  if (!s) return {};
  const d = SERVICE_DETAILS[s.slug];
  return {
    title: `${s.title} Services in Delhi`,
    description: d?.tagline ?? s.short,
    openGraph: { images: [s.image || d?.image || "/projects/vishnu-it-hero.webp"] },
    alternates: { canonical: `/services/${s.slug}` },
  };
}

const CAT_TO_PROJECT: Record<string, string[]> = {
  Development: ["Fintech", "E-commerce", "Website"],
  Design: ["Brand Design", "Website"],
  "Digital Marketing": ["Website", "E-commerce"],
  SEO: ["Website", "E-commerce"],
};

const STEP_TEXT = [
  "We listen first — goals, audience, competitors and what success looks like for you.",
  "Research and planning turn your goals into a clear, prioritised roadmap.",
  "Our specialists execute with craft, sharing progress at every milestone.",
  "Rigorous checks on quality, speed, tracking and every device.",
  "We go live smoothly and make sure everything works perfectly.",
  "Ongoing measurement and improvement to compound your results.",
  "Long-term support so you're never left on your own.",
  "Continuous partnership as your business grows.",
];

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [s, all, projects, plans, faqs, settings, testimonials] = await Promise.all([
    getService(slug), getServices(), getProjects(), getPlans(), getFaqs(), getSettings(), getTestimonials(),
  ]);
  if (!s) notFound();
  const x = CATEGORY_EXTRAS[s.category] ?? CATEGORY_EXTRAS.Development;
  const d = SERVICE_DETAILS[s.slug];
  const heroImg = s.image || d?.image || x.image;
  const coded = hasVisual(s.category) && !/^\/(uploads|media)\//.test(s.image ?? "");
  const gallery = d?.gallery ?? [];
  const intro = d?.intro ?? [s.description];
  const benefits = d?.benefits ?? x.benefits;
  const deliverables = d?.deliverables ?? x.deliverables;
  const idealFor = d?.idealFor ?? x.industries.slice(0, 4);
  const related = all.filter((r) => r.category === s.category && r.slug !== s.slug).slice(0, 3);
  const work = projects.filter((p) => p.cover && p.cover !== heroImg && CAT_TO_PROJECT[s.category]?.includes(p.category)).slice(0, 3);
  const allFaqs = [...(d?.faqs ?? []), ...x.faqs].map((f, i) => ({ ...f, id: 1000 + i })).concat(faqs.slice(0, 3));
  const steps = (s.process.length ? s.process : ["Discovery", "Strategy", "Execution", "Launch", "Optimise"]).map((t, i) => ({ title: t, text: STEP_TEXT[i] }));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    provider: { "@type": "Organization", name: settings.branding.siteName },
    areaServed: "IN",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden pt-28 pb-14 md:pt-40 md:pb-24">
        <div className="pointer-events-none absolute -top-40 left-1/3 -z-10 h-[520px] w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.14),transparent)] blur-2xl" />
        <div className="pointer-events-none absolute top-20 right-0 -z-10 size-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,0.12),transparent)] blur-2xl" />
        <div className="container-x grid items-center gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted">
              <Link href="/" className="hover:text-foreground">Home</Link><ChevronRight className="size-3" />
              <Link href="/services" className="hover:text-foreground">Services</Link><ChevronRight className="size-3" />
              <span className="text-foreground">{s.title}</span>
            </nav>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-semibold tracking-wide text-accent uppercase">
              <Icon name={s.icon} className="size-3.5" /> {x.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.04] font-extrabold tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl">
              {s.title} <span className="font-serif font-normal italic text-gradient">that delivers</span>
            </h1>
            <p className="mt-5 text-base text-pretty text-muted md:text-xl">{d?.tagline ?? s.short}</p>
            <div className="mt-7"><CheckList items={s.features.slice(0, 4)} /></div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#quote" className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_rgba(29,78,216,0.55)] transition hover:scale-[1.02]">Get a free quote <ArrowRight className="size-4" /></a>
              <a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold hover:border-accent"><Phone className="size-4" /> {settings.contact.phone}</a>
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-muted">
              <span className="flex text-amber-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</span>
              <span><b className="text-foreground">4.9/5</b> from 120+ happy clients</span>
            </div>
          </div>
          <Reveal className="relative min-w-0 lg:col-span-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-[#0a0f1f] p-2 shadow-[0_50px_120px_-40px_rgba(10,15,31,0.55)]">
              <div className="flex items-center gap-1.5 px-3 py-2"><span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /></div>
              <div className={`relative overflow-hidden rounded-[1.4rem] ${coded ? "aspect-[4/5] sm:aspect-[4/3]" : "aspect-[4/3]"}`}>
                {coded ? <CategoryVisual category={s.category} slug={s.slug} /> : <Image src={heroImg} alt={`${s.title} by Vishnu IT`} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover object-top" />}
              </div>
            </div>
            {d && (
              <div className="absolute -bottom-6 -left-3 hidden animate-float rounded-2xl border border-border bg-card p-4 shadow-2xl sm:block">
                <p className="flex items-center gap-1.5 text-xs text-muted"><IndianRupee className="size-3.5" /> Starting at</p>
                <p className="font-display text-2xl font-extrabold text-accent">{d.startingAt}</p>
              </div>
            )}
            <div className="absolute -top-5 -right-3 hidden animate-float rounded-2xl border border-border bg-card p-4 shadow-2xl [animation-delay:1.5s] sm:block">
              <p className="font-display text-3xl font-extrabold text-[#d4a017]">{x.results[0].value}</p>
              <p className="text-xs text-muted">{x.results[0].label}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* QUICK FACTS */}
      <section className="container-x">
        <div className="grid gap-px overflow-hidden rounded-[2rem] border border-border bg-border sm:grid-cols-3">
          {[
            { icon: CalendarClock, k: "Timeline", v: d?.timeline ?? "2 – 6 weeks" },
            { icon: IndianRupee, k: "Starting at", v: d?.startingAt ?? "₹25,000" },
            { icon: Users, k: "Ideal for", v: idealFor[0] },
          ].map((f) => (
            <div key={f.k} className="flex items-center gap-4 bg-card p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent"><f.icon className="size-5" /></span>
              <div><p className="text-xs text-muted">{f.k}</p><p className="font-display text-lg font-bold">{f.v}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* OVERVIEW + GALLERY */}
      <section className="container-x grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        <Reveal className="min-w-0">
          <span className="text-xs font-semibold tracking-widest text-accent uppercase">Overview</span>
          <h2 className="mt-3 font-display text-3xl leading-tight font-bold md:text-4xl">Why {s.title.toLowerCase()} <span className="font-serif font-normal italic text-gradient">matters</span></h2>
          <div className="mt-5 space-y-4">{intro.map((para, i) => <p key={i} className="leading-relaxed text-muted md:text-lg">{para}</p>)}</div>
          <div className="mt-8 rounded-3xl border border-border bg-card p-6">
            <p className="mb-4 text-sm font-semibold">Perfect for</p>
            <CheckList items={idealFor} />
          </div>
        </Reveal>
        {coded ? (
          <Reveal delay={0.05} className="min-w-0">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-[#0a0f1f] p-2 shadow-[0_50px_120px_-50px_rgba(10,15,31,0.6)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] sm:aspect-[4/3]">
                {s.category === "SEO" ? <SeoVisual variant={s.slug === "off-page-seo" ? "default" : "links"} /> : <MarketingVisual variant={s.slug === "social-media-marketing" ? "default" : "social"} />}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {x.results.slice(1, 3).map((r) => (
                <div key={r.label} className="rounded-2xl bg-[#0a0f1f] p-4 text-white">
                  <p className="font-display text-2xl font-extrabold text-[#f5c542]">{r.value}</p>
                  <p className="text-xs text-white/60">{r.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        ) : gallery.length > 0 && (
          <div className="grid grid-cols-5 gap-4">
            <Reveal className="col-span-3" delay={0.05}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] border border-border shadow-xl">
                <Image src={gallery[0]} alt={`${s.title} project example`} fill sizes="(max-width:1024px) 60vw, 30vw" className="object-cover object-top" />
              </div>
            </Reveal>
            <Reveal className="col-span-2 mt-14" delay={0.15}>
              <div className="relative aspect-[3/5] overflow-hidden rounded-[1.75rem] border border-border shadow-xl">
                <Image src={gallery[1] ?? gallery[0]} alt={`${s.title} work sample`} fill sizes="(max-width:1024px) 40vw, 20vw" className="object-cover object-top" />
              </div>
              <div className="mt-4 rounded-2xl bg-[#0a0f1f] p-4 text-white">
                <p className="font-display text-2xl font-extrabold text-[#f5c542]">{x.results[1].value}</p>
                <p className="text-xs text-white/60">{x.results[1].label}</p>
              </div>
            </Reveal>
          </div>
        )}
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="container-x pb-20 md:pb-28">
        <SectionHeading eyebrow="What's included" title={`Everything in our ${s.title.toLowerCase()}`} highlight="package" subtitle={s.short} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.features.map((f, i) => (
            <Reveal key={f} delay={i * 0.05}>
              <SpotlightCard className="h-full p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent"><Icon name={benefits[i % benefits.length].icon} className="size-5" /></span>
                  <span className="font-display text-4xl font-extrabold text-foreground/10">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{f}</h3>
                <div className="mt-4 h-1 w-10 rounded-full bg-gradient-to-r from-accent to-[#d4a017]" />
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BENEFITS (dark band) */}
      <section className="relative isolate overflow-hidden bg-[#05070d] py-20 text-white md:py-28">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.3),transparent)] blur-2xl" />
        <div className="container-x">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-[#f5c542] uppercase">Benefits</span>
            <h2 className="mt-5 font-display text-3xl leading-tight font-bold md:text-5xl">{x.headline} <span className="font-serif font-normal italic text-[#f5c542]">{x.highlight}</span></h2>
            <p className="mt-4 text-white/60 md:text-lg">{x.intro}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.06}>
                <div className="group h-full rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-7 transition hover:border-white/25 hover:bg-white/[0.06]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white shadow-lg shadow-blue-500/30 transition group-hover:scale-110"><Icon name={b.icon} className="size-5" /></span>
                  <h3 className="mt-5 font-display text-lg font-bold">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-4">
            {x.results.map((r) => (
              <div key={r.label} className="bg-[#05070d] p-6 text-center md:p-8">
                <p className="font-display text-3xl font-extrabold md:text-5xl">{r.value}</p>
                <p className="mt-1 text-xs tracking-wide text-white/55 uppercase">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS (scroll-driven) */}
      <section className="container-x py-20 md:py-28">
        <ScrollProcess steps={steps} eyebrow="How it works" title={`Our ${s.title.toLowerCase()}`} highlight="process" subtitle={`A proven ${steps.length}-step process — scroll to follow along.`} />
      </section>

      {/* DELIVERABLES + TECH */}
      <section className="container-x grid gap-6 pb-20 md:pb-28 lg:grid-cols-2">
        <Reveal className="rounded-[2rem] border border-border bg-card p-7 md:p-10">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">Deliverables</p>
          <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">What you get</h2>
          <div className="mt-7"><CheckList items={deliverables} /></div>
        </Reveal>
        <div className="flex flex-col gap-6">
          <Reveal delay={0.08} className="rounded-[2rem] border border-border bg-card p-7 md:p-10">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Tools & technology</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Our stack</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {x.tools.map((t) => <span key={t} className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium">{t}</span>)}
            </div>
          </Reveal>
          <Reveal delay={0.16} className="rounded-[2rem] border border-border bg-gradient-to-br from-accent/[0.07] to-[#d4a017]/[0.07] p-7 md:p-10">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Industries we serve</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {x.industries.map((t) => <span key={t} className="rounded-full bg-card px-3.5 py-1.5 text-sm font-medium shadow-sm">{t}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* WORK */}
      {work.length > 0 && (
        <section className="container-x pb-20 md:pb-28">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading align="left" className="mb-0 md:mb-0" eyebrow="Case studies" title="Work we're" highlight="proud of" />
            <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm font-semibold text-accent">View portfolio <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{work.map((p, i) => <Reveal key={p.slug} delay={i * 0.08}><ProjectCard p={p} /></Reveal>)}</div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="pb-20 md:pb-28">
        <div className="container-x"><SectionHeading eyebrow="Client love" title="What clients" highlight="say" /></div>
        <TestimonialsMarquee items={testimonials} />
      </section>

      {/* PRICING */}
      <section className="container-x pb-20 md:pb-28">
        <SectionHeading eyebrow="Pricing" title="Transparent" highlight="plans" subtitle="Pick a plan and pay securely online — or talk to us for a custom quote." />
        <Reveal><PricingCards plans={plans} /></Reveal>
      </section>

      {/* FAQ + QUOTE */}
      <section id="quote" className="container-x grid scroll-mt-28 gap-12 pb-20 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="FAQ" title={s.title} highlight="FAQs" />
          <FaqAccordion items={allFaqs} />
        </div>
        <div className="lg:pt-6">
          <div className="sticky top-28 rounded-[2rem] border border-border bg-card p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:p-9">
            <h3 className="font-display text-2xl font-bold">Get a quote for {s.title}</h3>
            <p className="mt-1.5 mb-6 text-sm text-muted">Free consultation · Reply within 24 hours</p>
            <ContactForm services={all.map((r) => r.title)} defaultService={s.title} compact />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-x pb-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold md:text-3xl">More {s.category} services</h2>
            <Link href="/services" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent">All services <ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ServiceCard key={r.slug} s={r} />)}</div>
        </section>
      )}
    </>
  );
}
