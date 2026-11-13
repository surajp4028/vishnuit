import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube, FaGithub, FaWhatsapp } from "react-icons/fa6";
import type { Settings, ServiceT } from "@/lib/server/content";

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  github: FaGithub,
};

const COMPANY = [["About us", "/about"], ["Portfolio", "/portfolio"], ["Pricing", "/pricing"], ["Blog & News", "/blog"], ["Contact", "/contact"]];
const CATS = ["Development", "Design", "Digital Marketing", "SEO"];

export function Footer({ settings, services }: { settings: Settings; services: ServiceT[] }) {
  const { branding, contact, social, founder } = settings;
  const year = new Date().getFullYear();
  const socials = Object.entries(social).filter(([, url]) => url);
  const tel = contact.phone.replace(/\s/g, "");

  return (
    <footer className="relative isolate mt-24 overflow-hidden bg-[#05070d] text-white">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.28),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 -z-10 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,0.14),transparent)] blur-2xl" />

      {/* Top CTA */}
      <div className="container-x pt-20 md:pt-28">
        <div className="grid items-end gap-10 border-b border-white/10 pb-14 md:pb-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-[#f5c542] uppercase">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-emerald-400" /></span>
              Available for new projects
            </span>
            <h2 className="mt-6 font-display text-4xl leading-[1.02] font-extrabold tracking-[-0.03em] text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              Have a project in mind? <span className="font-serif font-normal italic text-[#f5c542]">Let&apos;s talk.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <a href={`mailto:${contact.email}`} className="group inline-flex items-center gap-3 font-display text-xl font-bold break-all text-white/90 transition hover:text-white md:text-2xl">
              {contact.email}
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black transition group-hover:rotate-45"><ArrowUpRight className="size-4" /></span>
            </a>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d4a017] to-[#f5c542] px-6 py-3 text-sm font-bold text-black transition hover:scale-[1.03]">
                Start a project <ArrowRight className="size-4" />
              </Link>
              <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold transition hover:border-[#25D366] hover:text-[#25D366]">
                <FaWhatsapp className="size-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" className="relative block h-14 w-[170px]" aria-label={branding.siteName}>
            <Image src={branding.logoDark} alt={branding.siteName} fill sizes="170px" className="object-contain object-left" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            {branding.siteName} is a Delhi-based digital agency crafting premium websites, apps, SEO and performance marketing that turn ideas into powerful digital experiences.
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 pr-5 sm:inline-flex">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-xl"><Image src={founder.photo} alt={founder.name} fill sizes="44px" className="object-cover" /></div>
            <div>
              <p className="text-sm font-semibold">{founder.name}</p>
              <p className="text-xs text-white/50">{founder.role}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.map(([k, url]) => {
              const I = SOCIAL_ICONS[k];
              return I ? (
                <a key={k} href={url} target="_blank" rel="noopener noreferrer" aria-label={k} className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:-translate-y-0.5 hover:border-[#3b82f6] hover:bg-[#1d4ed8] hover:text-white">
                  <I className="size-4" />
                </a>
              ) : null;
            })}
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:-translate-y-0.5 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white">
              <FaWhatsapp className="size-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-5">
          <div>
            <p className="mb-5 text-xs font-semibold tracking-[0.18em] text-[#f5c542] uppercase">Company</p>
            <ul className="space-y-3 text-sm">
              {COMPANY.map(([l, h]) => (
                <li key={h}><Link href={h} className="group inline-flex items-center gap-1 text-white/65 transition hover:text-white">{l}<ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" /></Link></li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-5 text-xs font-semibold tracking-[0.18em] text-[#f5c542] uppercase">Services</p>
            <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {CATS.map((c) => {
                const top = services.filter((s) => s.category === c).slice(0, 3);
                return (
                  <div key={c} className="space-y-2.5">
                    <Link href={`/services#${c.toLowerCase().replace(/\s+/g, "-")}`} className="font-semibold text-white/90 hover:text-white">{c}</Link>
                    <ul className="space-y-2">
                      {top.map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`} className="text-white/55 transition hover:text-white">{s.title}</Link></li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <p className="mb-5 text-xs font-semibold tracking-[0.18em] text-[#f5c542] uppercase">Get in touch</p>
          <ul className="space-y-3">
            {[
              { icon: Phone, label: contact.phone, href: `tel:${tel}` },
              { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
              { icon: MapPin, label: contact.address, href: `https://maps.google.com/?q=${encodeURIComponent(contact.address)}` },
              { icon: Clock, label: contact.hours },
            ].map((x) => {
              const inner = (
                <>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-[#60a5fa]"><x.icon className="size-4" /></span>
                  <span className="pt-1.5 break-words">{x.label}</span>
                </>
              );
              return (
                <li key={x.label}>
                  {x.href ? (
                    <a href={x.href} target={x.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex gap-3 text-sm text-white/65 transition hover:text-white">{inner}</a>
                  ) : (
                    <div className="flex gap-3 text-sm text-white/65">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="container-x pointer-events-none select-none" aria-hidden>
        <p className="bg-gradient-to-b from-white/[0.14] to-white/0 bg-clip-text text-center font-display text-[19vw] leading-[0.8] font-black tracking-[-0.05em] text-transparent lg:text-[15rem]">VISHNU IT</p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/45 md:flex-row">
          <p>© {year} {branding.siteName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
            <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
          </div>
          <p>{branding.tagline} · Made with ♥ in Delhi</p>
        </div>
      </div>
    </footer>
  );
}
