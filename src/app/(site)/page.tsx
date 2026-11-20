import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Download, Rocket, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Hero } from "@/components/sections/hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { PostCard, PricingCards, ProcessSteps, ProjectCard, TechMarquee, TestimonialsMarquee } from "@/components/sections/blocks";
import { FaqAccordion } from "@/components/sections/interactive";
import { CapabilitiesBand, ServicesShowcase } from "@/components/sections/premium";
import { ContactForm } from "@/components/site/contact-form";
import { getBrands, getFaqs, getPlans, getPosts, getProjects, getServices, getSettings, getTestimonials } from "@/lib/server/content";
import { getCatalogConfig } from "@/lib/server/catalog";
import { StoreTeaser } from "@/components/sections/store-builder";

export const revalidate = 300;

const WHY = [
  { icon: Award, title: "Proven expertise", text: "150+ websites and platforms shipped for startups, fintechs and global brands." },
  { icon: Zap, title: "Blazing performance", text: "Next.js builds that score 90+ on Core Web Vitals and load in under 2 seconds." },
  { icon: TrendingUp, title: "Results-driven", text: "Every decision is tied to leads, sales and ROI — tracked and reported monthly." },
  { icon: ShieldCheck, title: "Secure by default", text: "Fintech-grade security practices from our payment-gateway engineering work." },
  { icon: Sparkles, title: "Premium design", text: "Award-level UI/UX and branding that make you look like the market leader." },
  { icon: Rocket, title: "End-to-end partner", text: "Strategy, design, development, SEO and marketing — one team, one invoice." },
];

export default async function HomePage() {
  const [settings, services, projects, testimonials, plans, faqs, posts, brands, catalog] = await Promise.all([
    getSettings(), getServices(), getProjects(), getTestimonials(), getPlans(), getFaqs(), getPosts(), getBrands(), getCatalogConfig(),
  ]);
  const featured = projects.filter((p) => p.cover).slice(0, 6);
  const shotSlugs = ["skyo-travel", "imoneypay-merchant-onboarding", "astro-kundli-milan"];
  const shots = shotSlugs
    .map((s) => projects.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => !!p?.cover)
    .map((p) => ({ src: p.cover!, title: p.title, href: `/portfolio/${p.slug}` }));
  const { hero, founder } = settings;

  return (
    <>
      <Hero
        {...hero}
        announcement={settings.conversion.announcement}
        avatars={testimonials.map((t) => t.avatar).filter(Boolean)}
        shots={shots.length ? shots : [{ src: "/projects/vishnu-it-hero.webp", title: "Vishnu IT", href: "/portfolio" }]}
      />

      <TechMarquee brands={brands.filter((b) => b.kind === "partner")} />

      {/* Services */}
      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow="What we do" title="Tailored digital solutions for" highlight="your success" subtitle="From pixel-perfect websites to high-converting ad campaigns — everything your brand needs to grow online, under one roof." />
        <Reveal><ServicesShowcase services={services.map(({ slug, title, category, icon, short }) => ({ slug, title, category, icon, short }))} /></Reveal>
        <div className="mt-10 text-center">
          <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-accent">
            Explore all {services.length} services <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <CapabilitiesBand />

      {catalog.features.newStores && <StoreTeaser />}

      {/* Featured work */}
      <section className="container-x py-20 md:py-28">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <SectionHeading align="left" className="mb-0 md:mb-0" eyebrow="Web folio" title="Work that speaks" highlight="for itself" subtitle="Fintech platforms, travel apps, e-commerce stores and brand sites — built with care and engineered to perform." />
          <Link href="/portfolio" className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">
            View all projects <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
          {featured.slice(0, 2).map((p, i) => <Reveal key={p.slug} delay={i * 0.1}><ProjectCard p={p} large /></Reveal>)}
        </div>
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(2, 5).map((p, i) => <Reveal key={p.slug} delay={i * 0.08}><ProjectCard p={p} /></Reveal>)}
        </div>
      </section>

      {/* Why us */}
      <section className="relative py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="container-x grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading align="left" eyebrow="Why Vishnu IT" title="Excellence in every" highlight="digital solution" subtitle="We combine creativity, engineering and marketing to deliver measurable growth — not just pretty pages." />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border">
              <Image src="/projects/vishnu-it-end-to-end.webp" alt="End-to-end website development by Vishnu IT" fill sizes="(max-width:1024px) 100vw, 40vw" className="object-cover object-top" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:pt-6">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.05}>
                <div className="group h-full rounded-3xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl">
                  <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/10 text-accent transition group-hover:scale-110">
                    <w.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="container-x py-20 md:py-28">
        <ProcessSteps />
      </section>

      {/* Pricing */}
      <section className="container-x py-20 md:py-28" id="pricing">
        <SectionHeading eyebrow="Pricing" title="Simple plans," highlight="serious results" subtitle="Transparent starting prices. Every project gets a custom quote based on scope — no hidden costs." />
        <Reveal><PricingCards plans={plans} /></Reveal>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="Testimonials" title="Loved by founders &" highlight="growing brands" subtitle="Don't take our word for it — here's what our clients say." />
        </div>
        <TestimonialsMarquee items={testimonials} />
      </section>

      {/* Founder */}
      <section className="container-x py-20 md:py-28">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2.5rem] border border-border bg-card p-6 md:p-12 lg:grid-cols-12">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] lg:col-span-5">
            <Image src={founder.photo} alt={founder.name} fill sizes="(max-width:1024px) 80vw, 35vw" className="object-cover" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-black/40 p-4 text-white backdrop-blur-md">
              <p className="font-display text-lg font-bold">{founder.name}</p>
              <p className="text-sm text-white/75">{founder.role}</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">Meet the founder</span>
            <h2 className="mt-5 font-display text-3xl leading-tight font-bold md:text-5xl">
              Built by an engineer who <span className="font-serif font-normal italic text-gradient">ships for fintech</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{founder.bio}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Payment gateway & merchant onboarding platforms", "Travel, astrology & e-commerce products", "150+ websites managed & maintained", "Next.js, Node.js, MySQL & WordPress expert"].map((x) => (
                <li key={x} className="flex items-start gap-2 text-sm"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" />{x}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={founder.portfolio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">View portfolio <ArrowRight className="size-4" /></a>
              <a href={founder.cv} download className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:border-accent"><Download className="size-4" /> Download CV</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ + quick contact */}
      <section className="container-x grid gap-12 py-20 md:py-28 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="FAQ" title="Questions?" highlight="Answered." subtitle="Everything you need to know before we start working together." />
          <FaqAccordion items={faqs} />
        </div>
        <div className="lg:pt-6">
          <div className="sticky top-28 rounded-[2rem] border border-border bg-card p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:p-9">
            <h3 className="font-display text-2xl font-bold">Get a free quote</h3>
            <p className="mt-1.5 mb-6 text-sm text-muted">Tell us about your project — we reply within 24 hours.</p>
            <ContactForm services={services.map((s) => s.title)} compact />
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="container-x py-20 md:py-28">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading align="left" className="mb-0 md:mb-0" eyebrow="Insights" title="Latest from" highlight="our blog" />
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">All articles <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((p) => <PostCard key={p.slug} p={p} />)}
        </div>
      </section>
    </>
  );
}
