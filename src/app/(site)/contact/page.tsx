import type { Metadata } from "next";
import Image from "next/image";
import { Clock, Download, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/sections/blocks";
import { ContactForm } from "@/components/site/contact-form";
import { getServices, getSettings } from "@/lib/server/content";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Contact Us — Get a Free Quote",
  description: "Talk to Vishnu IT Solutions about your website, app, SEO or marketing project. Call +91 79826 24533 or send us an enquiry.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ plan?: string; service?: string }> }) {
  const [settings, services, sp] = await Promise.all([getSettings(), getServices(), searchParams]);
  const c = settings.contact;
  const cards = [
    { icon: Phone, label: "Call us", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}` },
    { icon: MessageCircle, label: "WhatsApp", value: "Chat instantly", href: `https://wa.me/${c.whatsapp}` },
    { icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}` },
    { icon: MapPin, label: "Office", value: c.address, href: `https://maps.google.com/?q=${encodeURIComponent(c.address)}` },
  ];
  const preset = sp.service;
  return (
    <>
      <PageHeader eyebrow="Get in touch" title="Let's build something" highlight="great together" subtitle="Tell us about your project and we'll get back within 24 hours with ideas, a timeline and a transparent quote." />
      <section className="container-x grid gap-8 pb-20 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0a0f1f] p-6 text-white">
            <div className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.45),transparent)]" />
            <div className="relative flex items-center gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-[#f5c542]/60">
                <Image src={settings.founder.photo} alt={settings.founder.name} fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-xs tracking-widest text-[#f5c542] uppercase">Talk directly to</p>
                <p className="font-display text-2xl font-bold">{settings.founder.name}</p>
                <p className="text-sm text-white/65">{settings.founder.role}</p>
              </div>
            </div>
            <p className="relative mt-4 text-sm leading-relaxed text-white/70">No sales middlemen — your enquiry comes straight to me. I personally reply to every message within 24 hours.</p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"><MessageCircle className="size-4" /> WhatsApp</a>
              <a href={settings.founder.cv} download className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"><Download className="size-4" /> Download CV</a>
            </div>
          </div>
          {cards.map((x) => (
            <a key={x.label} href={x.href} target={x.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-5 transition hover:border-accent/50 hover:shadow-lg">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/10 text-accent transition group-hover:scale-110"><x.icon className="size-5" /></span>
              <span className="min-w-0">
                <span className="block text-xs text-muted">{x.label}</span>
                <span className="block font-semibold break-words">{x.value}</span>
              </span>
            </a>
          ))}
          <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-5 text-sm text-muted"><Clock className="size-5 text-accent" /> {c.hours}</div>
          {c.mapEmbed && (
            <div className="overflow-hidden rounded-3xl border border-border">
              <iframe src={c.mapEmbed} title="Office location" loading="lazy" className="h-64 w-full grayscale-[30%] dark:invert-[.9] dark:hue-rotate-180" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:p-10">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Send us an enquiry</h2>
            <p className="mt-1 mb-8 text-sm text-muted">{sp.plan ? `You selected the ${sp.plan} plan — tell us a bit more.` : "Fields marked * are required."}</p>
            <ContactForm services={services.map((s) => s.title)} defaultService={preset} defaultMessage={sp.plan ? `Hi, I'm interested in the ${sp.plan} plan. ` : undefined} />
          </div>
        </div>
      </section>
    </>
  );
}
