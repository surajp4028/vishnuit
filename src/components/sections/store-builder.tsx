import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Check, FileText, Link2, Package, Share2, ShoppingBag, Smartphone, Sparkles, Store, Truck } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { Reveal } from "@/components/reveal";

/** A real seller store shown as the live demo (opens in a new tab). Change with NEXT_PUBLIC_DEMO_STORE. */
export const DEMO_STORE_URL = `/catalog/@${process.env.NEXT_PUBLIC_DEMO_STORE || "pandeyfashion"}`;

export type StorePlan = { key: string; name: string; limit: number | null; price: number; razorpay: boolean; storageMb?: number };

export const STORE_FEATURES = [
  { icon: Link2, t: "Your link — or your own domain", d: "Start at vishnuit.co.in/catalog/@yourbrand, then connect yourbrand.com with free https." },
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

/**
 * MacBook-style laptop: thin black bezel with camera, screenshot screen with a soft glass glare,
 * hinge, and a brushed-aluminium base with the opening notch. Everything scales with width.
 */
export function LaptopFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* lid */}
      <div className="relative rounded-[2.2%/3.4%] bg-[#0b0c0f] p-[1.3%] pt-[2.4%]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,.09), 0 0 0 1px rgba(15,23,42,.18), 0 40px 80px -36px rgba(15,23,42,.55)" }}>
        <span className="absolute top-[0.9%] left-1/2 size-[0.7%] min-h-1 min-w-1 -translate-x-1/2 rounded-full bg-[#2b2f36] ring-1 ring-white/10" />
        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.6%] bg-white">
          <Image src={src} alt={alt} fill sizes="(min-width:1024px) 640px, 90vw" className="object-cover object-top" />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.18)_0%,rgba(255,255,255,0)_38%)]" />
        </div>
      </div>
      {/* hinge + base */}
      <div className="relative mx-[1.5%] h-[5px] rounded-b-[3px] bg-gradient-to-b from-[#2a2d33] to-[#16181c]" />
      <div className="relative mx-[-7%] h-[clamp(8px,2.4vw,14px)] rounded-b-[50%_100%] bg-gradient-to-b from-[#f1f2f4] via-[#d4d7dd] to-[#a7acb5]" style={{ boxShadow: "0 1px 0 rgba(255,255,255,.7) inset, 0 22px 32px -18px rgba(15,23,42,.55)" }}>
        <span className="absolute top-0 left-1/2 h-[45%] w-[14%] -translate-x-1/2 rounded-b-[6px] bg-gradient-to-b from-[#b7bcc4] to-[#d6d9de]" />
      </div>
    </div>
  );
}

/**
 * iPhone-style phone: titanium edge with side buttons, thin black bezel, Dynamic Island.
 * Corner radii are % based so it looks right at any size.
 */
export function PhoneFrame({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative "}${className}`}>
      {/* side buttons */}
      <span className="absolute top-[17%] -left-[1.6%] h-[4%] w-[1.8%] rounded-l-sm bg-gradient-to-r from-[#5b6068] to-[#2a2d33]" />
      <span className="absolute top-[24%] -left-[1.6%] h-[7.5%] w-[1.8%] rounded-l-sm bg-gradient-to-r from-[#5b6068] to-[#2a2d33]" />
      <span className="absolute top-[33%] -left-[1.6%] h-[7.5%] w-[1.8%] rounded-l-sm bg-gradient-to-r from-[#5b6068] to-[#2a2d33]" />
      <span className="absolute top-[27%] -right-[1.6%] h-[11%] w-[1.8%] rounded-r-sm bg-gradient-to-l from-[#5b6068] to-[#2a2d33]" />
      {/* titanium frame */}
      <div className="rounded-[17%/7.9%] p-[1.6%]" style={{ background: "linear-gradient(145deg,#8a8f98 0%,#3b3f46 22%,#1d1f23 50%,#3b3f46 78%,#8a8f98 100%)", boxShadow: "0 30px 60px -22px rgba(15,23,42,.6), 0 0 0 1px rgba(15,23,42,.25)" }}>
        {/* black bezel */}
        <div className="rounded-[15.6%/7.3%] bg-black p-[3.2%]">
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[12.5%/5.8%] bg-white [container-type:inline-size]">
            {/* status bar (the screenshot starts below it, like a real iPhone) */}
            <div className="absolute inset-x-0 top-0 z-10 flex h-[6%] items-center justify-between bg-white px-[9%] pt-[1%] text-black">
              <span className="text-[clamp(6px,2.4cqw,11px)] font-semibold" style={{ fontSize: "min(4.2cqw, 12px)" }}>9:41</span>
              <span className="flex items-center gap-[3cqw]">
                <svg viewBox="0 0 18 12" className="w-[7cqw]"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
                <svg viewBox="0 0 25 12" className="w-[8.5cqw]"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity=".45" /><rect x="2" y="2" width="16" height="8" rx="1.6" /><rect x="22.5" y="4" width="1.8" height="4" rx=".8" opacity=".45" /></svg>
              </span>
            </div>
            <div className="absolute inset-x-0 top-[6%] bottom-0"><Image src={src} alt={alt} fill sizes="260px" className="object-cover object-top" /></div>
            <span className="absolute top-[1.3%] left-1/2 z-20 h-[3.3%] w-[31%] -translate-x-1/2 rounded-full bg-black" />
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.16)_0%,rgba(255,255,255,0)_40%)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Laptop + phone composition with two floating cards. */
export function StoreMockup({ size = "lg" }: { size?: "md" | "lg" }) {
  return (
    <div className={`relative mx-auto w-full pt-6 pb-[7%] ${size === "lg" ? "max-w-[640px]" : "max-w-[520px]"}`}>
      <LaptopFrame src="/stores/desktop-home-v2.webp" alt="A store built with Vishnu Stores on a laptop" className="ml-auto w-[86%]" />
      <PhoneFrame src="/stores/phone-product-v2.webp" alt="Product page on a phone" className="absolute bottom-0 left-0 w-[27%] drop-shadow-[0_25px_35px_rgba(15,23,42,.35)] sm:left-[2%] sm:w-[23%]" />
      <div className="absolute top-0 left-[18%] hidden sm:flex items-center gap-2.5 rounded-2xl border border-black/5 bg-white/95 px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(15,23,42,.35)] backdrop-blur motion-safe:animate-[float_6s_ease-in-out_infinite]">
        <span className="grid size-8 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><ShoppingBag className="size-4" /></span>
        <span><span className="block text-[12px] font-bold text-slate-900">New order · ₹2,499</span><span className="block text-[11px] text-slate-500">Cash on delivery</span></span>
      </div>
      <div className="absolute right-0 bottom-[2%] hidden sm:flex items-center gap-2.5 rounded-2xl border border-black/5 bg-white/95 px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(15,23,42,.35)] backdrop-blur motion-safe:animate-[float_7s_ease-in-out_1.5s_infinite]">
        <span className="grid size-8 place-items-center rounded-full bg-amber-400/15 text-amber-600"><BadgeCheck className="size-4" /></span>
        <span><span className="block text-[12px] font-bold text-slate-900">UPI payment received</span><span className="block text-[11px] text-slate-500">GST invoice sent</span></span>
      </div>
    </div>
  );
}

/** Short, light home-page teaser. The full story and pricing live on /online-store. */
export function StoreTeaser() {
  return (
    <section id="online-store" className="container-x scroll-mt-24 pt-14 pb-2 md:pt-20 md:pb-4">
      <Reveal>
        <div className="relative isolate grid items-center gap-8 overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-[#f6f8ff] via-white to-[#fff8e8] p-6 sm:gap-10 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-12 dark:from-card dark:via-card dark:to-card">
          <div className="pointer-events-none absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(37,99,235,.14),transparent)]" />
          <div className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.18),transparent)]" />
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[10.5px] font-bold tracking-[3px] text-accent"><Sparkles className="size-3.5" /> NEW · VISHNU STORES</span>
            <h2 className="mt-5 font-display text-3xl leading-[1.08] font-extrabold tracking-tight sm:text-[2.5rem]">
              Launch your online store for <span className="block min-h-[1.15em] sm:inline sm:min-h-0"><FlipWords words={["fashion", "jewellery", "home décor", "plants", "your brand"]} className="!px-0 !text-accent" /></span>
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">Your own catalogue link, COD & UPI orders, GST invoices and delivery tracking — set up from your phone in 5 minutes.</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-foreground/70">
              {["Free plan", "0% commission", "No coding"].map((x) => <span key={x} className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" />{x}</span>)}
            </div>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/online-store" className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background">Explore Online Store <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
              <Link href="/account/store" className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold hover:border-accent">Create free store</Link>
              <a href={DEMO_STORE_URL} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1.5 px-2 py-3.5 text-sm font-semibold text-accent hover:underline">See live demo ↗</a>
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
              {[p.limit == null ? "Unlimited products" : `Up to ${p.limit} products`, p.storageMb ? `${p.storageMb >= 1024 ? `${+(p.storageMb / 1024).toFixed(1)} GB` : `${p.storageMb} MB`} photo & video storage` : null, "Own store link & design styles", "COD & UPI orders", p.razorpay ? "Razorpay online payments" : null, p.key !== "free" ? "Connect your own domain (.com / .in)" : null, "GST invoices & order tracking", "WhatsApp share cards"].filter(Boolean).map((f) => (
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
