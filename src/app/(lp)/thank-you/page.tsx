import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { getSettings } from "@/lib/server/content";
import { MetaPixel } from "@/components/lp/meta-pixel";
import { resolveLpPixel } from "@/lib/server/lp-pixels";

export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

const SHOWCASE = [
  ["SKYO Travel", "/projects/skyo-home.webp", "/portfolio/skyo-travel"],
  ["ASTRO Kundli", "/projects/kundli-home.webp", "/portfolio/astro-kundli-milan"],
  ["Suraj.dev Portfolio", "/projects/suraj-portfolio-v1-hero.webp", "/portfolio/suraj-dev-portfolio"],
];

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ n?: string; from?: string }> }) {
  const [{ contact, founder }, sp] = await Promise.all([getSettings(), searchParams]);
  const pixel = await resolveLpPixel((sp.from ?? "").replace(/^\//, "").replace(/[^a-z0-9-]/gi, "") || null);
  const name = (sp.n ?? "").replace(/[^\p{L}\s.'-]/gu, "").slice(0, 30);
  return (
    <>
    <MetaPixel pixelId={pixel.pixelId} />
    <section className="relative isolate overflow-hidden pt-32 pb-20 md:pt-40">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.16),transparent)] blur-2xl" />
      <div className="container-x max-w-3xl text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="size-10" /></div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Thank you{name ? `, ${name}` : ""}! 🎉</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Your request has been received. {founder.name} or our team will call you shortly with ideas and a fixed quote.</p>
        <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
          {[["1", "We review your needs", "Within minutes"], ["2", "We call you", "Usually within 30 min"], ["3", "You get a fixed quote", "Same day"]].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-border bg-card p-4">
              <span className="grid size-8 place-items-center rounded-full bg-[#1d4ed8] text-sm font-bold text-white">{n}</span>
              <p className="mt-3 text-sm font-bold">{t}</p>
              <p className="flex items-center gap-1 text-xs text-muted"><Clock className="size-3" /> {d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm font-semibold">Can&apos;t wait? Reach us right now:</p>
        <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Hi, I just submitted the form on your website.")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white"><FaWhatsapp className="size-5" /> Chat on WhatsApp</a>
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-bold"><Phone className="size-4" /> {contact.phone}</a>
        </div>
      </div>
      <div className="container-x mt-16 max-w-5xl">
        <p className="mb-5 text-center text-sm font-semibold text-muted">Meanwhile, explore some of our live work</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {SHOWCASE.map(([t, img, url]) => (
            <Link key={t} href={url} className="group overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[16/10]"><Image src={img} alt={t} fill sizes="33vw" className="object-cover object-top transition duration-700 group-hover:scale-105" /></div>
              <p className="flex items-center justify-between p-3 text-sm font-semibold">{t} <ArrowUpRight className="size-4 text-muted" /></p>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm"><Link href="/" className="font-semibold text-[#1d4ed8] hover:underline">← Back to website</Link></p>
      </div>
    </section>
    </>
  );
}
