import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, Download, Eye, Heart, Target } from "lucide-react";
import { PageHeader, ProcessSteps, TestimonialsMarquee, TechMarquee } from "@/components/sections/blocks";
import { SectionHeading } from "@/components/section-heading";
import { Stats } from "@/components/sections/interactive";
import { Reveal } from "@/components/reveal";
import { getBrands, getSettings, getTestimonials } from "@/lib/server/content";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "About Us — Innovating the Future of Digital Solutions",
  description: "Vishnu IT Solutions is a Delhi-based digital agency combining creativity and engineering — web development, SEO, branding, marketing and UI/UX.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: Target, title: "Our mission", text: "To turn ideas into powerful digital experiences that grow businesses — with honesty, craft and measurable results." },
  { icon: Eye, title: "Our vision", text: "To be India's most trusted growth partner for startups and SMEs — blending fintech-grade engineering with world-class design." },
  { icon: Heart, title: "Our values", text: "Designed with faith: transparency, ownership and obsessive attention to detail in every pixel and every line of code." },
];

const TIMELINE = [
  ["2023", "Started building websites, landing pages and CRM-connected ad funnels for immigration and service businesses."],
  ["2024", "Vishnu IT takes shape — WordPress, WooCommerce and brand design for clients in India, Canada and Africa."],
  ["2025", "Expanded into fintech: payment gateway plugins, trading APIs, onboarding dashboards and 150+ managed websites."],
  ["2026", "Full-stack Next.js products — SKYO travel, ASTRO Kundli, merchant onboarding for payment gateways — and this new site."],
];

export default async function AboutPage() {
  const [settings, testimonials, brands] = await Promise.all([getSettings(), getTestimonials(), getBrands()]);
  const { founder } = settings;
  return (
    <>
      <PageHeader eyebrow="About us" title="Innovating the future of" highlight="digital solutions" subtitle="We're a team of developers, designers and marketers combining creativity and technology to help businesses thrive online." />

      <section className="container-x grid items-center gap-12 pb-20 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border">
              <Image src="/projects/vishnu-it-story-hd.webp" alt="Vishnu IT Solutions story" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover object-top" />
            </div>
            <div className="absolute -right-3 -bottom-6 rounded-3xl border border-border bg-card p-5 shadow-2xl md:-right-8">
              <p className="font-display text-4xl font-extrabold">150<span className="text-accent">+</span></p>
              <p className="text-xs text-muted">Projects delivered</p>
            </div>
          </div>
        </Reveal>
        <div>
          <SectionHeading align="left" className="mb-6 md:mb-8" eyebrow="Our story" title="Smart solutions for" highlight="your business" />
          <div className="space-y-4 text-base leading-relaxed text-muted md:text-lg">
            <p>Vishnu IT Solutions is a digital marketing and IT services agency based in Gandhi Nagar, Delhi. We specialise in SEO, PPC, social media marketing and web development that help brands get found, trusted and chosen.</p>
            <p>What started as a freelance practice building websites and ad funnels has grown into a full-service studio shipping fintech platforms, travel and astrology products, e-commerce stores and brand identities for clients across India and abroad.</p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Innovative web development", "Powerful SEO strategies", "Creative branding & design", "Impactful marketing solutions"].map((x) => (
              <li key={x} className="flex items-center gap-2 text-sm font-medium"><BadgeCheck className="size-5 text-accent" /> {x}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-x pb-20"><Stats stats={settings.stats} /></section>

      <section className="container-x grid gap-5 pb-20 md:grid-cols-3">
        {VALUES.map((v, i) => (
          <Reveal key={v.title} delay={i * 0.08}>
            <div className="h-full rounded-[1.75rem] border border-border bg-card p-8">
              <div className="grid size-12 place-items-center rounded-2xl bg-foreground text-background"><v.icon className="size-5" /></div>
              <h3 className="mt-6 font-display text-xl font-bold">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{v.text}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="container-x py-16">
        <SectionHeading eyebrow="Our journey" title="Growing with" highlight="every project" />
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute top-0 bottom-0 left-[19px] w-px bg-gradient-to-b from-accent via-border to-transparent md:left-1/2" />
          {TIMELINE.map(([y, t], i) => (
            <Reveal key={y} delay={i * 0.05}>
              <div className={`relative mb-10 flex gap-6 md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-10" : "md:pr-10 md:text-right md:flex-row-reverse"}`}>
                <span className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-4 border-background bg-accent text-xs font-bold text-white md:absolute md:top-0 ${i % 2 ? "md:-left-5" : "md:-right-5"}`}>●</span>
                <div className="rounded-3xl border border-border bg-card p-6">
                  <p className="font-display text-2xl font-extrabold text-accent">{y}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid items-center gap-10 rounded-[2.5rem] border border-border bg-card p-6 md:p-12 lg:grid-cols-12">
          <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-[2rem] lg:col-span-4">
            <Image src={founder.photo} alt={founder.name} fill sizes="320px" className="object-cover" />
          </div>
          <div className="lg:col-span-8">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Founder</p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">{founder.name}</h2>
            <p className="text-muted">{founder.role}</p>
            <p className="mt-5 leading-relaxed text-muted md:text-lg">{founder.bio}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={founder.portfolio} target="_blank" rel="noopener noreferrer" className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">Personal portfolio</a>
              <a href={founder.cv} download className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:border-accent"><Download className="size-4" /> CV</a>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <ProcessSteps />
      </section>
      <TechMarquee brands={brands.filter((b) => b.kind === "partner")} />
      <section className="py-16">
        <div className="container-x"><SectionHeading eyebrow="Testimonials" title="Stories from" highlight="our clients" /></div>
        <TestimonialsMarquee items={testimonials} />
      </section>
    </>
  );
}
