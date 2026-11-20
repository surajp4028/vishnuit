"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, Share2, ShoppingBag, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { rupee, useCart } from "./cart";
import { hexFor, isColourOption, isLight } from "@/lib/colors";

type P = {
  id: number; slug: string; name: string; price: number; compare_price: number | null; stock: number | null;
  options: { name: string; values: string[]; swatches?: Record<string, string> }[]; variants: { key: string; price: number | null; stock: number | null }[];
  gst_rate?: number | null;
};

/** Phones: full-bleed swipe with counter. Desktop: 2-up photo grid (Myntra-style) with hover zoom on each photo. */
export function ProductGallery({ images, name, badge }: { images: string[]; name: string; badge?: string | null }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  if (!images.length) return <div className="aspect-[4/5] bg-foreground/[.04] sm:rounded-3xl" />;
  return (
    <div>
      {/* phone: swipe */}
      <div className="relative md:hidden">
        <div ref={ref} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto bg-foreground/[.04] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {images.map((src, k) => <img key={k} src={src} alt={k === 0 ? name : ""} className="size-full shrink-0 snap-center object-cover" />)}
        </div>
        {badge && <span className="pointer-events-none absolute top-4 left-4 rounded-md bg-[#ff3f6c] px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white">{badge}</span>}
        {images.length > 1 && (
          <>
            <span className="pointer-events-none absolute right-4 bottom-4 rounded-pill bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{i + 1} / {images.length}</span>
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5">{images.map((_, k) => <span key={k} className={cn("h-1.5 rounded-full bg-white shadow transition-all", k === i ? "w-5" : "w-1.5 opacity-60")} />)}</div>
          </>
        )}
      </div>
      {/* desktop: 2-up grid */}
      <div className={cn("relative hidden gap-2.5 md:grid", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {images.map((src, k) => (
          <div key={k} className={cn("group overflow-hidden rounded-2xl bg-foreground/[.04]", images.length > 1 && images.length % 2 === 1 && k === images.length - 1 ? "col-span-2 aspect-[16/10]" : "aspect-[3/4]")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={k === 0 ? name : ""} loading={k > 1 ? "lazy" : "eager"} className="size-full cursor-zoom-in object-cover transition duration-500 group-hover:scale-110" />
          </div>
        ))}
        {badge && <span className="pointer-events-none absolute top-4 left-4 rounded-md bg-[#ff3f6c] px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white">{badge}</span>}
      </div>
    </div>
  );
}

export function ProductBuy({ p, image, base, whatsapp, storeName }: { p: P; image: string | null; base: string; whatsapp: string; storeName: string }) {
  const router = useRouter();
  const { add } = useCart();
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState("");
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const needs = p.options.filter((o) => o.values.length);
  const key = needs.length && needs.every((o) => sel[o.name]) ? needs.map((o) => sel[o.name]).join(" / ") : null;
  const variant = useMemo(() => (key ? p.variants.find((v) => v.key === key) ?? null : null), [key, p.variants]);
  const price = variant?.price ?? p.price;
  const stock = needs.length ? variant?.stock ?? null : p.stock;
  const allOut = p.variants.length ? p.variants.every((v) => v.stock === 0) : p.stock === 0;
  const soldOut = stock === 0 || allOut;
  const off = p.compare_price && p.compare_price > price ? Math.round((1 - price / p.compare_price) * 100) : 0;

  // Show the sticky phone bar once the main buttons scroll out of view.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function line() {
    if (needs.length && !key) {
      setErr(`Please select ${needs.filter((o) => !sel[o.name]).map((o) => o.name.toLowerCase()).join(" & ")}`);
      ctaRef.current?.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }
    setErr("");
    return { id: p.id, slug: p.slug, name: p.name, image, variant: key, price, qty, gst: p.gst_rate ?? null };
  }
  const addToBag = () => { const l = line(); if (l) { add(l); setAdded(true); setTimeout(() => setAdded(false), 1800); } };
  const buyNow = () => { const l = line(); if (l) { add(l); router.push(`${base}/cart`); } };

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-display text-[1.75rem] font-extrabold tracking-tight">{rupee(price)}</p>
        {off > 0 && <><p className="text-base text-muted">MRP <span className="line-through">{rupee(p.compare_price!)}</span></p><p className="text-base font-bold text-[#ff905a]">({off}% OFF)</p></>}
      </div>
      <p className="mt-0.5 text-xs font-medium text-emerald-600">Inclusive of all taxes</p>

      {needs.map((o) => (
        <div key={o.name} className="mt-7">
          <div className="flex items-center justify-between"><p className="text-[13px] font-bold tracking-[1.5px] uppercase">{isColourOption(o.name) ? "Colour" : `Select ${o.name}`}</p>{sel[o.name] && <p className="text-xs text-muted">Selected: <b className="text-foreground">{sel[o.name]}</b></p>}</div>
          {isColourOption(o.name) ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {o.values.map((v) => {
                const hex = hexFor(v, o.swatches) ?? "#cccccc";
                const out = needs.length === 1 && p.variants.find((x) => x.key === v)?.stock === 0;
                const on = sel[o.name] === v;
                return (
                  <button key={v} type="button" disabled={out} title={v} aria-label={v} onClick={() => { setSel((s) => ({ ...s, [o.name]: v })); setErr(""); }}
                    className={cn("group flex flex-col items-center gap-1.5", out && "cursor-not-allowed opacity-40")}>
                    <span className={cn("relative size-11 rounded-full ring-offset-2 ring-offset-background transition", on ? "ring-2 ring-foreground" : "ring-1 ring-transparent group-hover:ring-foreground/30", isLight(hex) && !on && "shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]")} style={{ background: hex }}>
                      {out && <span className="absolute inset-x-1 top-1/2 h-px -rotate-45 bg-foreground/60" />}
                    </span>
                    <span className={cn("max-w-16 truncate text-[11px] font-semibold", on ? "text-foreground" : "text-muted")}>{v}</span>
                  </button>
                );
              })}
            </div>
          ) : (
          <div className="mt-3 flex flex-wrap gap-2.5">
            {o.values.map((v) => {
              // With one option we know exactly which variant a value maps to, so sold-out sizes can be greyed out.
              const out = needs.length === 1 && p.variants.find((x) => x.key === v)?.stock === 0;
              const on = sel[o.name] === v;
              return (
                <button key={v} disabled={out} onClick={() => { setSel((s) => ({ ...s, [o.name]: v })); setErr(""); }}
                  className={cn("relative grid h-12 min-w-12 place-items-center rounded-pill border px-4 text-sm font-bold transition", on ? "border-[#ff3f6c] text-[#ff3f6c] ring-1 ring-[#ff3f6c]" : "border-border hover:border-foreground", out && "cursor-not-allowed text-muted opacity-50 after:absolute after:inset-x-2 after:top-1/2 after:h-px after:-rotate-[20deg] after:bg-muted")}>{v}</button>
              );
            })}
          </div>
          )}
        </div>
      ))}
      {err && <p className="mt-3 text-sm font-semibold text-[#ff3f6c]">{err}</p>}

      <div className="mt-7 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-border">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less" className="grid size-11 place-items-center"><Minus className="size-4" /></button>
          <span className="w-7 text-center font-bold">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(stock ?? 99, q + 1))} aria-label="More" className="grid size-11 place-items-center"><Plus className="size-4" /></button>
        </div>
        {stock != null && stock > 0 && stock <= 5 && <span className="text-sm font-bold text-[#ff3f6c]">Hurry — only {stock} left!</span>}
      </div>

      <div ref={ctaRef} className="mt-6 grid grid-cols-2 gap-3">
        <button disabled={soldOut} onClick={addToBag} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-foreground py-4 text-[13px] font-extrabold tracking-wide uppercase transition active:scale-[.98] disabled:opacity-40">
          {added ? <><Check className="size-4" /> Added</> : <><ShoppingBag className="size-4" /> {soldOut ? "Sold out" : "Add to bag"}</>}
        </button>
        <button disabled={soldOut} onClick={buyNow} className="flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-[13px] font-extrabold tracking-wide text-background uppercase transition active:scale-[.98] disabled:opacity-40"><Zap className="size-4" /> Buy now</button>
      </div>
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${storeName}, I want to order: ${p.name}${key ? ` (${key})` : ""} × ${qty}`)}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/[.06] py-3.5 text-[13px] font-bold text-[#128C7E]">
          <FaWhatsapp className="size-5" /> Order or ask on WhatsApp
        </a>
      )}
      <button type="button" onClick={async () => {
        const url = window.location.href;
        const text = `${p.name} — ${rupee(price)} at ${storeName}`;
        try { if (navigator.share) { await navigator.share({ title: p.name, text, url }); return; } } catch { return; }
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
      }} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-[13px] font-semibold text-muted hover:text-foreground"><Share2 className="size-4" /> Share this product</button>

      {/* phone sticky bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pt-2.5 pb-[max(.65rem,env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-300 md:hidden", showBar ? "translate-y-0" : "translate-y-full")}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 pl-1"><p className="truncate text-[11px] text-muted">{key || p.name}</p><p className="font-display text-lg leading-tight font-extrabold">{rupee(price)}</p></div>
          {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${storeName}, about: ${p.name}`)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border text-[#25D366]"><FaWhatsapp className="size-5" /></a>}
          <button disabled={soldOut} onClick={addToBag} className="h-12 shrink-0 rounded-2xl border-2 border-foreground px-4 text-xs font-extrabold uppercase disabled:opacity-40">{added ? "Added ✓" : "Add"}</button>
          <button disabled={soldOut} onClick={buyNow} className="h-12 shrink-0 rounded-2xl bg-foreground px-5 text-xs font-extrabold text-background uppercase disabled:opacity-40">Buy now</button>
        </div>
      </div>
    </div>
  );
}
