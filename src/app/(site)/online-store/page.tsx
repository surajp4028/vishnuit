import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Globe, Lock, Palette, ShieldCheck, Sparkles, Truck, Wallet } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { FlipWords } from "@/components/ui/flip-words";
import { FaqAccordion } from "@/components/sections/interactive";
import { LaptopFrame, PhoneFrame, STORE_FEATURES, STORE_STEPS, StoreMockup, StorePlans, DEMO_STORE_URL, DEMO_DOMAIN, DemoLinks } from "@/components/sections/store-builder";
import { getCatalogConfig, PLAN_KEYS } from "@/lib/server/catalog";

export const metadata: Metadata = {
  title: "Online Store Builder for Indian Sellers — Vishnu Stores",
  description: "Create your own online store in 5 minutes: catalogue link, COD & UPI orders, GST invoices, delivery tracking and WhatsApp-ready product links. Free plan, 0% commission.",
  alternates: { canonical: "/online-store" },
  openGraph: { title: "Your own online store in 5 minutes — Vishnu Stores", description: "Free plan, 0% commission. COD & UPI orders, GST invoices, your own domain.", url: "/online-store", type: "website" },
};
export const revalidate = 300;

const FAQ = [
  { id: 1, question: "Do you take any commission on my sales?", answer: "No. You pay only the yearly plan (Free plan available). COD and UPI money comes straight to you; online payments go to your own Razorpay account." },
  { id: 2, question: "Can I run my store only from my phone?", answer: "Yes. Adding products, accepting orders, updating delivery status, printing invoices — everything works on mobile." },
  { id: 3, question: "Do I get GST invoices?", answer: "Yes. Add your GSTIN and every order gets a proper tax invoice — CGST/SGST within your state, IGST for other states, with per-product GST slabs and HSN codes." },
  { id: 4, question: "How do delivery charges work?", answer: "You set them per payment method (COD, UPI, online), plus a free-delivery threshold and minimum order value. Shoppers see it clearly at checkout." },
  { id: 5, question: "What happens when my plan ends?", answer: "You get a reminder a month before. After expiry your store keeps working for 15 days, then moves to the Free plan limits — nothing is deleted." },
  { id: 6, question: "Can I use my own domain?", answer: "Yes. On any paid plan, open Seller → Domain, type the domain you bought (e.g. yourbrand.com from GoDaddy, Hostinger or BigRock) and add the 1–2 DNS records we show you. Your store opens at yourbrand.com with free https (SSL), and your vishnuit.co.in/catalog/@yourname link keeps working too." },
  { id: 7, question: "I don't have a domain yet — do I need one?", answer: "No. Every store gets a free link right away (vishnuit.co.in/catalog/@yourname). Buy a domain later (about ₹500–1,000 a year) and connect it whenever you like — nothing else changes." },
];

export default async function OnlineStorePage() {
  const cfg = await getCatalogConfig();
  const plans = PLAN_KEYS.map((k) => ({ key: k, name: cfg.plans[k].name, limit: cfg.plans[k].limit, price: k === "free" ? 0 : cfg.plans[k].price, razorpay: cfg.plans[k].razorpay, storageMb: cfg.plans[k].storageMb }));
  const cta = cfg.features.newStores ? "/account/store" : "/contact";

  return (
    <>
      {/* hero */}
      <section className="relative isolate overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#f4f7ff] via-background to-background dark:from-background" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 right-0 -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.16),transparent)]" />
        <div className="container-x grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1.5 text-[11px] font-bold tracking-[3px] text-accent"><Sparkles className="size-3.5" /> VISHNU STORES</span>
            <h1 className="mt-6 font-display text-[2.6rem] leading-[1.03] font-extrabold tracking-tight sm:text-6xl">
              Sell online with your own store for <span className="block min-h-[1.1em] lg:inline lg:min-h-0"><FlipWords words={["fashion", "jewellery", "home décor", "plants", "your brand"]} className="!px-0 !text-accent" /></span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">A premium catalogue with your logo and link. Take COD & UPI orders, send GST invoices and track every delivery — all from your phone. No coding, no commission.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cta} className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-bold text-background shadow-[0_20px_50px_-20px_rgba(15,23,42,.6)]">Create my store — free <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
              <a href={`https://${DEMO_DOMAIN}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-4 text-sm font-semibold hover:border-accent">See live demo ↗</a>
              <a href="#pricing" className="inline-flex items-center gap-2 px-3 py-4 text-sm font-semibold text-muted hover:text-foreground">See pricing</a>
            </div>
            <DemoLinks className="mt-5" />
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
              {["Free forever plan", "0% commission", "Live in 5 minutes"].map((x) => <span key={x} className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" />{x}</span>)}
            </div>
          </div>
          <div className="rise" style={{ animationDelay: ".12s" }}><StoreMockup size="lg" /></div>
        </div>
      </section>

      {/* three phones */}
      <section className="container-x py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold tracking-[4px] text-accent">BUILT FOR PHONES</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Your shoppers buy on phones. So does your store.</h2>
        </div>
        <div className="mt-14 grid items-end gap-8 sm:grid-cols-3 sm:gap-6">
          {[["/stores/phone-home-v2.webp", "Beautiful home page", "Banners, offers bar, categories and bestsellers."], ["/stores/phone-product-v2.webp", "Product pages that sell", "Photo gallery, sizes, % OFF and sticky Buy now."], ["/stores/phone-seller-v2.webp", "Orders in your pocket", "Confirm, pack, ship and deliver with one tap."]].map(([src, t, d], i) => (
            <Reveal key={src} delay={i * 0.08}>
              <PhoneFrame src={src} alt={t} className={`mx-auto w-[220px] ${i === 1 ? "sm:-translate-y-8" : ""}`} />
              <p className="mt-6 text-center font-display text-lg font-bold">{t}</p>
              <p className="mt-1 text-center text-sm text-muted">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="bg-foreground/[.025] py-16 md:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold tracking-[4px] text-accent">EVERYTHING INCLUDED</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Everything a real shop needs</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 0.05} className="h-full">
                <div className="group h-full rounded-3xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_24px_60px_-30px_rgba(37,99,235,.45)]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,.7)] transition group-hover:scale-110"><f.icon className="size-5" /></span>
                  <p className="mt-5 font-display text-lg font-bold">{f.t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* own domain */}
      <section className="container-x pb-4">
        <Reveal>
          <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] border border-border bg-card p-5 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[4px] text-accent">YOUR OWN DOMAIN</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Open your store at <span className="text-accent">yourbrand.com</span></h2>
              <p className="mt-4 text-muted">Start with a free link today. When you&apos;re ready, connect a domain you own — your customers see only your brand, and https is switched on for you.</p>
              <ol className="mt-6 space-y-3 text-sm">
                {[
                  ["Buy a domain", "From GoDaddy, Hostinger, BigRock… (about ₹500–1,000 / year)"],
                  ["Connect it in your dashboard", "Seller → Domain → type it → Connect"],
                  ["Add 1–2 DNS records", "We show exactly what to copy-paste, with a Copy button"],
                  ["You're live", "yourbrand.com opens your store, with free SSL"],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background">{i + 1}</span><span><b className="block">{t}</b><span className="text-muted">{d}</span></span></li>
                ))}
              </ol>
              <p className="mt-5 text-xs text-muted">On all paid plans. Your vishnuit.co.in/catalog/@yourname link keeps working too.</p>
            </div>
            {/* browser bar mock: free link → own domain */}
            <div className="min-w-0 space-y-4">
              {[
                { url: "vishnuit.co.in/catalog/@yourbrand", tag: "Free link", dim: true, href: DEMO_STORE_URL },
                { url: "yourbrand.com", tag: "Your domain", dim: false, href: `https://${DEMO_DOMAIN}` },
              ].map((b) => (
                <a key={b.url} href={b.href} target="_blank" rel="noopener" title="Open the live demo" className={`block rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 ${b.dim ? "border-border bg-background opacity-70 hover:opacity-100" : "border-accent/40 bg-background shadow-[0_24px_60px_-30px_rgba(37,99,235,.5)]"}`}>
                  <div className="flex items-center gap-1.5 pb-2.5"><span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /><span className="ml-auto rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold text-muted">{b.tag}</span></div>
                  <div className="flex items-center gap-2 rounded-xl bg-foreground/[.04] px-3.5 py-2.5 text-sm">
                    {b.dim ? <Globe className="size-4 text-muted" /> : <Lock className="size-4 text-emerald-600" />}
                    <span className={`truncate font-mono ${b.dim ? "text-muted" : "font-semibold"}`}>https://{b.url}</span>
                  </div>
                </a>
              ))}
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted"><ArrowRight className="size-3.5 rotate-90" /> same store, same products, same orders</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* dashboard */}
      <section className="container-x grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1fr_1.25fr]">
        <Reveal>
          <p className="text-[11px] font-bold tracking-[4px] text-accent">SELLER DASHBOARD</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Run your business, not your website</h2>
          <ul className="mt-8 space-y-5">
            {[
              [Wallet, "Payments your way", "COD, your own UPI/QR, or Razorpay. Delivery charge per payment method, free above any amount you choose."],
              [ShieldCheck, "GST done right", "Per-product GST slabs and HSN, IGST for other states, invoices your shopper can download."],
              [Truck, "Every order tracked", "Placed → confirmed → packed → shipped → delivered, with courier and AWB for the shopper."],
              [Palette, "Your look, one click", "Sharp, Minimal or Soft design, your banners, testimonials, offers bar and policies."],
            ].map(([I, t, d]) => { const Icon = I as typeof Wallet; return (
              <li key={t as string} className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Icon className="size-5" /></span><span><span className="block font-semibold">{t as string}</span><span className="mt-0.5 block text-sm text-muted">{d as string}</span></span></li>
            ); })}
          </ul>
        </Reveal>
        <Reveal delay={0.1}><LaptopFrame src="/stores/desktop-seller-v2.webp" alt="Vishnu Stores seller dashboard" /></Reveal>
      </section>

      {/* steps */}
      <section className="container-x py-12 md:py-16">
        <div className="grid gap-4 rounded-[2rem] border border-border bg-card p-6 sm:grid-cols-2 sm:p-10 lg:grid-cols-4">
          {STORE_STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.06}>
              <div className="relative">
                <span className="font-display text-6xl font-extrabold text-foreground/[.06]">0{i + 1}</span>
                <div className="-mt-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-foreground text-background"><s.icon className="size-5" /></span><p className="font-display text-lg font-bold">{s.t}</p></div>
                <p className="mt-2 pl-[52px] text-sm text-muted">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className="container-x grid gap-10 py-16 md:py-24 lg:grid-cols-[.8fr_1.2fr]">
        <div><p className="text-[11px] font-bold tracking-[4px] text-accent">QUESTIONS</p><h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Good to know</h2><p className="mt-4 text-muted">Still unsure? <Link href="/contact" className="font-semibold text-accent hover:underline">Talk to us</Link> — we&apos;ll help you set up.</p></div>
        <FaqAccordion items={FAQ} />
      </section>

      {/* pricing */}
      <section id="pricing" className="scroll-mt-24 bg-gradient-to-b from-background via-[#f6f8ff] to-background py-16 md:py-24 dark:via-background">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold tracking-[4px] text-accent">PRICING</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Start free. Grow when you&apos;re ready.</h2>
            <p className="mt-4 text-muted">Yearly plans, no commission on sales. Buy 1–4 years at once.</p>
          </div>
          <div className="mt-12"><StorePlans plans={plans} gstRate={cfg.gstRate} /></div>
        </div>
      </section>

      {/* final cta */}
      <section className="container-x pb-20">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-accent to-[#1e3a8a] px-8 py-14 text-center text-white sm:px-16">
          <div className="pointer-events-none absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(245,197,66,.45),transparent)]" />
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Your store could be live today.</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">Create it free, add a few products and share the link on Instagram tonight.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={cta} className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#1e3a8a]">Create my store — free <ArrowRight className="size-4" /></Link>
            <a href={`https://${DEMO_DOMAIN}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-4 text-sm font-semibold text-white hover:bg-white/10">See live demo ↗</a>
          </div>
          <DemoLinks dark className="mt-6 justify-center" />
        </div>
      </section>
    </>
  );
}
