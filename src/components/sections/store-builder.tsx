import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Check, FileText, Link2, Package, Share2, ShoppingBag, Smartphone, Sparkles, Store, Truck, Zap } from "lucide-react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FlipWords } from "@/components/ui/flip-words";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Reveal } from "@/components/reveal";

type Plan = { key: string; name: string; limit: number | null; price: number };

const FEATURES = [
  { icon: Link2, t: "Your own store link", d: "vishnuit.co.in/catalog/@yourbrand" },
  { icon: Banknote, t: "COD, UPI & cards", d: "Get paid straight to your account" },
  { icon: Truck, t: "Orders & tracking", d: "Confirm, ship, deliver — customers get updates" },
  { icon: FileText, t: "GST invoices", d: "CGST/SGST or IGST, auto-generated" },
  { icon: Share2, t: "WhatsApp-ready", d: "Beautiful link previews with your logo" },
  { icon: Smartphone, t: "Run it from your phone", d: "Add products, reply, ship — anywhere" },
];
const STEPS = [
  { icon: Store, t: "Create your store", d: "Name, logo, link — 2 minutes" },
  { icon: Package, t: "Add products", d: "Photos, sizes, prices, stock" },
  { icon: Share2, t: "Share your link", d: "Instagram, WhatsApp, anywhere" },
  { icon: ShoppingBag, t: "Get orders", d: "COD or online, tracked end-to-end" },
];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Home-page band that sells the catalog store builder. */
export function StoreBuilderShowcase({ plans, cta }: { plans: Plan[]; cta: string }) {
  return (
    <section id="online-store" className="relative isolate scroll-mt-20 overflow-hidden bg-[#05070d] py-24 text-white md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10"><Spotlight /></div>
      <BackgroundBeams className="-z-10 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,.16),transparent)]" />

      <div className="container-x">
        <div className="grid items-center gap-16 xl:grid-cols-[1.05fr_1fr] xl:gap-12">
          {/* copy */}
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3.5 py-1.5 text-[11px] font-bold tracking-[3px] text-amber-300"><Sparkles className="size-3.5" /> NEW · VISHNU STORES</span>
            <h2 className="mt-6 font-display text-[2.5rem] leading-[1.04] font-extrabold tracking-tight sm:text-[3.4rem] 2xl:text-6xl">
              Your own online store for
              <span className="block"><FlipWords words={["fashion", "jewellery", "home décor", "plants", "bakery", "your brand"]} className="!px-0 bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent" /></span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">Create a premium catalogue, take COD & UPI orders, print GST invoices and track every delivery — all from your phone. No coding, no commission on your sales.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={cta} className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-4 text-sm font-bold text-black shadow-[0_0_40px_-8px_rgba(245,197,66,.6)] transition hover:shadow-[0_0_60px_-6px_rgba(245,197,66,.8)]">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-200/60 to-transparent transition duration-700 group-hover:translate-x-full" />
                <Zap className="relative size-4" /><span className="relative">Create my store — free</span><ArrowRight className="relative size-4 transition group-hover:translate-x-1" />
              </Link>
              <a href="#store-plans" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 text-sm font-semibold text-white/85 transition hover:border-white/40 hover:text-white">See plans</a>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50">
              <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-400" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-400" /> 0% commission</span>
              <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-400" /> Live in 5 minutes</span>
            </p>
          </Reveal>

          {/* device mockups */}
          <Reveal delay={0.15}>
            <div className="relative mx-auto h-[460px] w-full max-w-[560px] [perspective:1600px] sm:h-[520px]">
              {/* laptop */}
              <div className="absolute top-6 right-0 w-[88%] rounded-2xl border border-white/10 bg-[#0d1018] p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)] [transform-style:preserve-3d] max-sm:hidden" style={{ transform: "rotateY(-12deg) rotateX(4deg)" }}>
                <div className="flex items-center gap-1.5 px-2 pb-2"><span className="size-2 rounded-full bg-red-400/70" /><span className="size-2 rounded-full bg-amber-400/70" /><span className="size-2 rounded-full bg-emerald-400/70" /><span className="ml-3 truncate rounded-md bg-white/5 px-3 py-1 text-[10px] text-white/40">vishnuit.co.in/catalog/@yourbrand</span></div>
                <div className="overflow-hidden rounded-xl bg-white text-black">
                  <div className="bg-black py-1 text-center text-[8px] font-bold tracking-[2px] text-white">FREE DELIVERY ON ORDERS ABOVE ₹1,500</div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-[10px] font-extrabold"><span>YOUR BRAND</span><span className="h-4 w-28 rounded-full bg-black/5" /><ShoppingBag className="size-3.5" /></div>
                  <div className="relative mx-3 h-28 overflow-hidden bg-gradient-to-br from-[#2b1d14] via-[#6b3f2a] to-[#c58b5a]"><div className="absolute bottom-3 left-4"><div className="text-[15px] leading-tight font-extrabold text-white">Festive Edit &apos;26</div><div className="mt-1.5 inline-block bg-white px-2 py-0.5 text-[7px] font-bold">SHOP NOW</div></div></div>
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {["from-rose-200 to-rose-400", "from-emerald-200 to-emerald-500", "from-amber-100 to-amber-400", "from-indigo-200 to-indigo-500"].map((g, i) => (
                      <div key={g}><div className={`aspect-[3/4] bg-gradient-to-br ${g}`} /><div className="mt-1 h-1.5 w-4/5 rounded-full bg-black/10" /><div className="mt-1 text-[8px] font-bold">₹{[1299, 2499, 899, 3999][i].toLocaleString("en-IN")} <span className="text-[#ff905a]">({[28, 30, 31, 22][i]}% OFF)</span></div></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* phone */}
              <div className="absolute bottom-0 left-2 w-[210px] rounded-[2.2rem] border border-white/15 bg-[#0d1018] p-2 shadow-[0_40px_100px_-20px_rgba(0,0,0,.95)] sm:left-0" style={{ transform: "rotate(-4deg)" }}>
                <div className="overflow-hidden rounded-[1.8rem] bg-white text-black">
                  <div className="mx-auto mt-1.5 h-4 w-16 rounded-full bg-black" />
                  <div className="aspect-[4/5] bg-gradient-to-br from-emerald-700 to-emerald-950" />
                  <div className="space-y-1.5 p-3">
                    <div className="text-[8px] font-bold tracking-[2px] text-black/40">SAREES</div>
                    <div className="text-[13px] leading-tight font-extrabold">Banarasi Silk Saree</div>
                    <div className="text-[11px] font-extrabold">₹6,999 <span className="font-medium text-black/40 line-through">₹9,999</span> <span className="text-[#ff905a]">30% OFF</span></div>
                    <div className="flex gap-1">{["S", "M", "L"].map((x) => <span key={x} className="grid size-5 place-items-center rounded-full border text-[8px] font-bold">{x}</span>)}</div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1"><span className="border border-black py-1.5 text-center text-[8px] font-extrabold">ADD TO BAG</span><span className="bg-black py-1.5 text-center text-[8px] font-extrabold text-white">BUY NOW</span></div>
                  </div>
                </div>
              </div>

              {/* floating notifications (illustrative) */}
              <div className="absolute top-0 left-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 shadow-2xl backdrop-blur-xl motion-safe:animate-[float_6s_ease-in-out_infinite] sm:left-10">
                <span className="grid size-9 place-items-center rounded-full bg-emerald-500/20 text-emerald-300"><ShoppingBag className="size-4" /></span>
                <span><span className="block text-[12px] font-bold">New order · ₹2,499</span><span className="block text-[11px] text-white/50">Cash on delivery · Delhi</span></span>
              </div>
              <div className="absolute right-2 bottom-24 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 shadow-2xl backdrop-blur-xl motion-safe:animate-[float_7s_ease-in-out_1.5s_infinite]">
                <span className="grid size-9 place-items-center rounded-full bg-amber-400/20 text-amber-300"><BadgeCheck className="size-4" /></span>
                <span><span className="block text-[12px] font-bold">UPI payment received</span><span className="block text-[11px] text-white/50">GST invoice sent</span></span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* features */}
        <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.t} delay={i * 0.05} className="h-full">
              <div className="group h-full bg-[#070a12] p-6 transition hover:bg-[#0b0f1a] sm:p-7">
                <f.icon className="size-6 text-amber-300 transition group-hover:scale-110" />
                <p className="mt-4 font-display text-lg font-bold">{f.t}</p>
                <p className="mt-1 text-sm text-white/55">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* steps */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="relative">
                <span className="font-display text-5xl font-extrabold text-white/[.07]">0{i + 1}</span>
                <div className="-mt-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white text-black"><s.icon className="size-5" /></span><p className="font-display text-lg font-bold">{s.t}</p></div>
                <p className="mt-2 pl-[52px] text-sm text-white/55">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* plans */}
        {plans.length > 0 && (
          <div id="store-plans" className="mt-20 scroll-mt-28">
            <p className="text-center text-[11px] font-bold tracking-[4px] text-white/45">SIMPLE YEARLY PLANS · + GST</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((p) => {
                const hot = p.key === "growth";
                return (
                  <div key={p.key} className={`relative rounded-3xl border p-6 ${hot ? "border-amber-300/60 bg-gradient-to-b from-amber-300/[.12] to-transparent" : "border-white/10 bg-white/[.03]"}`}>
                    {hot && <span className="absolute -top-3 left-6 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-extrabold tracking-wider text-black">MOST POPULAR</span>}
                    <p className="font-display text-lg font-bold">{p.name}</p>
                    <p className="mt-3 font-display text-4xl font-extrabold">{p.price ? inr(p.price) : "Free"}<span className="text-sm font-medium text-white/45">{p.price ? " /year" : ""}</span></p>
                    <p className="mt-2 text-sm text-white/60">{p.limit == null ? "Unlimited products" : `Up to ${p.limit} products`}</p>
                    <Link href={cta} className={`mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition ${hot ? "bg-amber-300 text-black hover:bg-amber-200" : "border border-white/15 hover:border-white/40"}`}>{p.price ? "Get started" : "Create free store"} <ArrowRight className="size-4" /></Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
