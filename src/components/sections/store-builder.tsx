import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Check, FileText, Link2, Package, Share2, ShoppingBag, Smartphone, Sparkles, Store, Truck } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { Reveal } from "@/components/reveal";

export type StorePlan = { key: string; name: string; limit: number | null; price: number; razorpay: boolean };

export const STORE_FEATURES = [
  { icon: Link2, t: "Your own store link", d: "vishnuit.co.in/catalog/@yourbrand — put it in your Instagram bio." },
  { icon: Banknote, t: "COD, UPI & cards", d: "Money goes straight to your bank or UPI. No middleman, no commission." },
  { icon: Truck, t: "Orders & tracking", d: "Confirm → pack → ship → deliver. Customers get every update." },
  { icon: FileText, t: "GST invoices", d: "CGST/SGST or IGST, per-product GST slabs, generated automatically." },
  { icon: Share2, t: "WhatsApp-ready links", d: "Every product shares with its photo, price and % OFF." },
  { icon: Smartphone, t: "Run it from your phone", d: "Add products, accept orders, ship — your whole shop in your pocket." },
];
export const STORE_STEPS = [
  { icon: Store, t: "Create your store", d: "Name, logo and link — 2 minutes" },
  { icon: Package, t: "Add products", d: "Photos, sizes, prices and stock" },
  { icon: Share2, t: "Share your link", d: "Instagram bio, WhatsApp, anywhere" },
  { icon: ShoppingBag, t: "Get orders", d: "COD or online, tracked end-to-end" },
];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Real screenshot inside a laptop frame. */
export function LaptopFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={className}>
      <div className="rounded-t-[1.1rem] border border-black/10 bg-[#0f1115] p-[1.6%] pb-[1.2%] shadow-[0_30px_80px_-30px_rgba(15,23,42,.45)]">
        <div className="mx-auto mb-[1%] size-1.5 rounded-full bg-white/20" />
        <div className="relative aspect-[16/10] overflow-hidden rounded-[.35rem] bg-white">
          <Image src={src} alt={alt} fill sizes="(min-width:1024px) 640px, 90vw" className="object-cover object-top" />
        </div>
      </div>
      <div className="relative mx-[-6%] h-3 rounded-b-[1.2rem] bg-gradient-to-b from-[#d9dce3] to-[#a9aeb8] shadow-[0_18px_30px_-12px_rgba(15,23,42,.5)]"><div className="absolute top-0 left-1/2 h-1.5 w-[18%] -translate-x-1/2 rounded-b-lg bg-[#8d929c]" /></div>
    </div>
  );
}

/** Real screenshot inside a phone frame. */
export function PhoneFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`rounded-[2.4rem] border border-black/10 bg-[#0f1115] p-[3.5%] shadow-[0_30px_70px_-20px_rgba(15,23,42,.55)] ${className}`}>
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2rem] bg-white">
        <Image src={src} alt={alt} fill sizes="240px" className="object-cover object-top" />
        <div className="absolute top-2 left-1/2 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}

/** Laptop + phone composition with two floating cards. */
export function StoreMockup({ size = "lg" }: { size?: "md" | "lg" }) {
  return (
    <div className={`relative mx-auto w-full ${size === "lg" ? "max-w-[640px] pb-14" : "max-w-[520px] pb-10"}`}>
      <LaptopFrame src="/stores/desktop-home.webp" alt="A store built with Vishnu Stores on a laptop" className="ml-auto w-[88%]" />
      <PhoneFrame src="/stores/phone-product.webp" alt="Product page on a phone" className={`absolute bottom-0 left-0 ${size === "lg" ? "w-[30%]" : "w-[29%]"}`} />
      <div className="absolute -top-4 left-[14%] flex items-center gap-2.5 rounded-2xl border border-black/5 bg-white/95 px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(15,23,42,.35)] backdrop-blur motion-safe:animate-[float_6s_ease-in-out_infinite]">
        <span className="grid size-8 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><ShoppingBag className="size-4" /></span>
        <span><span className="block text-[12px] font-bold text-slate-900">New order · ₹2,499</span><span className="block text-[11px] text-slate-500">Cash on delivery</span></span>
      </div>
      <div className="absolute right-[-2%] bottom-6 flex items-center gap-2.5 rounded-2xl border border-black/5 bg-white/95 px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(15,23,42,.35)] backdrop-blur motion-safe:animate-[float_7s_ease-in-out_1.5s_infinite]">
        <span className="grid size-8 place-items-center rounded-full bg-amber-400/15 text-amber-600"><BadgeCheck className="size-4" /></span>
        <span><span className="block text-[12px] font-bold text-slate-900">UPI payment received</span><span className="block text-[11px] text-slate-500">GST invoice sent</span></span>
      </div>
    </div>
  );
}

/** Short, light home-page teaser. The full story and pricing live on /online-store. */
export function StoreTeaser() {
  return (
    <section id="online-store" className="container-x scroll-mt-24 py-14 md:py-20">
      <Reveal>
        <div className="relative isolate grid items-center gap-10 overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-[#f6f8ff] via-white to-[#fff8e8] p-7 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-12 dark:from-card dark:via-card dark:to-card">
          <div className="pointer-events-none absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(37,99,235,.14),transparent)]" />
          <div className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.18),transparent)]" />
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[10.5px] font-bold tracking-[3px] text-accent"><Sparkles className="size-3.5" /> NEW · VISHNU STORES</span>
            <h2 className="mt-5 font-display text-3xl leading-[1.08] font-extrabold tracking-tight sm:text-[2.5rem]">
              Launch your online store for <FlipWords words={["fashion", "jewellery", "home décor", "plants", "your brand"]} className="!px-0 !text-accent" />
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">Your own catalogue link, COD & UPI orders, GST invoices and delivery tracking — set up from your phone in 5 minutes.</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-foreground/70">
              {["Free plan", "0% commission", "No coding"].map((x) => <span key={x} className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" />{x}</span>)}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/online-store" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background">Explore Online Store <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
              <Link href="/account/store" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold hover:border-accent">Create free store</Link>
            </div>
          </div>
          <StoreMockup size="md" />
        </div>
      </Reveal>
    </section>
  );
}

/** Pricing cards for /online-store. */
export function StorePlans({ plans, gstRate }: { plans: StorePlan[]; gstRate: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((p) => {
        const hot = p.key === "growth";
        return (
          <div key={p.key} className={`relative flex flex-col rounded-[1.75rem] border bg-card p-7 transition hover:-translate-y-1 hover:shadow-xl ${hot ? "border-accent shadow-[0_30px_80px_-35px_rgba(37,99,235,.55)] ring-1 ring-accent" : "border-border"}`}>
            {hot && <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold tracking-wider text-white">MOST POPULAR</span>}
            <p className="font-display text-lg font-bold">{p.name}</p>
            <p className="mt-4 font-display text-[2.6rem] leading-none font-extrabold tracking-tight">{p.price ? inr(p.price) : "₹0"}<span className="ml-1 text-sm font-medium text-muted">/year</span></p>
            <p className="mt-1 text-xs text-muted">{p.price ? `+ ${gstRate}% GST · pay for 1–4 years at once` : "Free forever"}</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-foreground/80">
              {[p.limit == null ? "Unlimited products" : `Up to ${p.limit} products`, "Own store link & design styles", "COD & UPI orders", p.razorpay ? "Razorpay online payments" : null, "GST invoices & order tracking", "WhatsApp share cards"].filter(Boolean).map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className={`mt-0.5 size-4 shrink-0 ${hot ? "text-accent" : "text-emerald-500"}`} />{f}</li>
              ))}
            </ul>
            <Link href="/account/store" className={`mt-7 flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition ${hot ? "bg-accent text-white hover:opacity-90" : "bg-foreground text-background hover:opacity-90"}`}>{p.price ? "Start free, upgrade anytime" : "Create free store"} <ArrowRight className="size-4" /></Link>
          </div>
        );
      })}
    </div>
  );
}
