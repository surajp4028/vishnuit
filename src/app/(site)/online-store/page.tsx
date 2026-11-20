import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Palette, ShieldCheck, Sparkles, Truck, Wallet } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { FlipWords } from "@/components/ui/flip-words";
import { FaqAccordion } from "@/components/sections/interactive";
import { LaptopFrame, PhoneFrame, STORE_FEATURES, STORE_STEPS, StoreMockup, StorePlans } from "@/components/sections/store-builder";
import { getCatalogConfig, PLAN_KEYS } from "@/lib/server/catalog";

export const metadata: Metadata = {
  title: "Online Store Builder for Indian Sellers — Vishnu Stores",
  description: "Create your own online store in 5 minutes: catalogue link, COD & UPI orders, GST invoices, delivery tracking and WhatsApp-ready product links. Free plan, 0% commission.",
  alternates: { canonical: "/online-store" },
};
export const revalidate = 300;

const FAQ = [
  { id: 1, question: "Do you take any commission on my sales?", answer: "No. You pay only the yearly plan (Free plan available). COD and UPI money comes straight to you; online payments go to your own Razorpay account." },
  { id: 2, question: "Can I run my store only from my phone?", answer: "Yes. Adding products, accepting orders, updating delivery status, printing invoices — everything works on mobile." },
  { id: 3, question: "Do I get GST invoices?", answer: "Yes. Add your GSTIN and every order gets a proper tax invoice — CGST/SGST within your state, IGST for other states, with per-product GST slabs and HSN codes." },
  { id: 4, question: "How do delivery charges work?", answer: "You set them per payment method (COD, UPI, online), plus a free-delivery threshold and minimum order value. Shoppers see it clearly at checkout." },
  { id: 5, question: "What happens when my plan ends?", answer: "You get a reminder a month before. After expiry your store keeps working for 15 days, then moves to the Free plan limits — nothing is deleted." },
  { id: 6, question: "Can I use my own domain?", answer: "Your store lives at vishnuit.co.in/catalog/@yourname today. Custom domains are on our roadmap — talk to us if you need one now." },
];

export default async function OnlineStorePage() {
  const cfg = await getCatalogConfig();
  const plans = PLAN_KEYS.map((k) => ({ key: k, name: cfg.plans[k].name, limit: cfg.plans[k].limit, price: k === "free" ? 0 : cfg.plans[k].price, razorpay: cfg.plans[k].razorpay }));
  const cta = cfg.features.newStores ? "/account/store" : "/contact";

  return (
    <>
      {/* hero */}
      <section className="relative isolate overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#f4f7ff] via-background to-background dark:from-background" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 right-0 -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.16),transparent)]" />
        <div className="container-x grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1.5 text-[11px] font-bold tracking-[3px] text-accent"><Sparkles className="size-3.5" /> VISHNU STORES</span>
            <h1 className="mt-6 font-display text-[2.6rem] leading-[1.03] font-extrabold tracking-tight sm:text-6xl">
              Sell online with your own store for <FlipWords words={["fashion", "jewellery", "home décor", "plants", "your brand"]} className="!px-0 !text-accent" />
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">A premium catalogue with your logo and link. Take COD & UPI orders, send GST invoices and track every delivery — all from your phone. No coding, no commission.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cta} className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-bold text-background shadow-[0_20px_50px_-20px_rgba(15,23,42,.6)]">Create my store — free <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
              <a href="#pricing" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-4 text-sm font-semibold hover:border-accent">See pricing</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
              {["Free forever plan", "0% commission", "Live in 5 minutes"].map((x) => <span key={x} className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" />{x}</span>)}
            </div>
          </Reveal>
          <Reveal delay={0.12}><StoreMockup size="lg" /></Reveal>
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
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-md transition group-hover:scale-110"><f.icon className="size-5" /></span>
                  <p className="mt-5 font-display text-lg font-bold">{f.t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
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
          <Link href={cta} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-[#1e3a8a]">Create my store — free <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </>
  );
}
