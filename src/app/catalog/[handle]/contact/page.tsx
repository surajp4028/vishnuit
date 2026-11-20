import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { getStoreByHandle } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Contact" };
export const revalidate = 120;

export default async function Contact({ params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const c = s.contact;
  const rows = [
    c.whatsapp && { icon: FaWhatsapp, label: "WhatsApp", value: `+${c.whatsapp}`, href: `https://wa.me/${c.whatsapp}` },
    c.phone && { icon: Phone, label: "Call", value: c.phone, href: `tel:${c.phone}` },
    c.email && { icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}` },
    c.instagram && { icon: FaInstagram, label: "Instagram", value: c.instagram.replace(/^https?:\/\/(www\.)?/, ""), href: c.instagram },
    c.address && { icon: MapPin, label: "Visit", value: c.address, href: `https://www.google.com/maps/search/${encodeURIComponent(c.address)}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];
  return (
    <section className="mx-auto max-w-3xl px-5 pt-10 sm:pt-16">
      <p className="text-xs font-semibold tracking-[4px] text-muted">CONTACT</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">We&apos;d love to hear from you</h1>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <a key={r.label} href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-start gap-4 rounded-[1.4rem] border border-border p-5 transition hover:border-foreground/40">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background"><r.icon className="size-5" /></span>
            <span className="min-w-0"><span className="block text-xs font-semibold tracking-widest text-muted uppercase">{r.label}</span><span className="mt-1 block font-semibold break-words whitespace-pre-line">{r.value}</span></span>
          </a>
        ))}
        {!rows.length && <p className="text-muted">Contact details coming soon.</p>}
      </div>
    </section>
  );
}
