"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { rupee, useCart } from "./cart";

type P = {
  id: number; slug: string; name: string; price: number; compare_price: number | null; stock: number | null;
  options: { name: string; values: string[] }[]; variants: { key: string; price: number | null; stock: number | null }[];
};

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  if (!images.length) return <div className="aspect-[4/5] rounded-[1.6rem] bg-foreground/[.04]" />;
  return (
    <div>
      <div ref={ref} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto rounded-[1.6rem] bg-foreground/[.04] [scrollbar-width:none]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {images.map((src, k) => <img key={k} src={src} alt={k === 0 ? name : ""} className="size-full shrink-0 snap-center object-cover" />)}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, k) => (
            <button key={k} onClick={() => ref.current?.scrollTo({ left: k * ref.current.clientWidth, behavior: "smooth" })} className={cn("size-16 shrink-0 overflow-hidden rounded-xl border-2 transition", i === k ? "border-foreground" : "border-transparent opacity-60")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
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
  const needs = p.options.filter((o) => o.values.length);
  const key = needs.length && needs.every((o) => sel[o.name]) ? needs.map((o) => sel[o.name]).join(" / ") : null;
  const variant = useMemo(() => (key ? p.variants.find((v) => v.key === key) ?? null : null), [key, p.variants]);
  const price = variant?.price ?? p.price;
  const stock = needs.length ? variant?.stock ?? null : p.stock;
  const soldOut = stock === 0;

  function line() {
    if (needs.length && !key) { setErr(`Please choose ${needs.filter((o) => !sel[o.name]).map((o) => o.name.toLowerCase()).join(" & ")}.`); return null; }
    setErr("");
    return { id: p.id, slug: p.slug, name: p.name, image, variant: key, price, qty };
  }

  return (
    <div>
      <p className="font-display text-2xl font-bold">{rupee(price)}{p.compare_price && p.compare_price > price ? <span className="ml-3 text-base font-medium text-muted line-through">{rupee(p.compare_price)}</span> : null}</p>
      <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

      {needs.map((o) => (
        <div key={o.name} className="mt-7">
          <p className="text-sm font-semibold">{o.name}{sel[o.name] ? <span className="font-normal text-muted"> · {sel[o.name]}</span> : null}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {o.values.map((v) => {
              // With one option we know exactly which variant a value maps to, so sold-out sizes can be greyed out.
              const out = needs.length === 1 && p.variants.find((x) => x.key === v)?.stock === 0;
              return (
                <button key={v} disabled={out} onClick={() => setSel((s) => ({ ...s, [o.name]: v }))} className={cn("min-w-12 rounded-full border px-4 py-2.5 text-sm font-semibold transition", sel[o.name] === v ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50", out && "cursor-not-allowed text-muted line-through opacity-50")}>{v}</button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-7 flex items-center gap-3">
        <div className="flex items-center rounded-full border border-border">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less" className="grid size-12 place-items-center"><Minus className="size-4" /></button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(stock ?? 99, q + 1))} aria-label="More" className="grid size-12 place-items-center"><Plus className="size-4" /></button>
        </div>
        {stock != null && stock > 0 && stock <= 5 && <span className="text-xs font-semibold text-amber-600">Only {stock} left</span>}
      </div>
      {err && <p className="mt-3 text-sm font-medium text-red-500">{err}</p>}

      <div className="mt-6 grid gap-3">
        <button disabled={soldOut} onClick={() => { const l = line(); if (l) { add(l); setAdded(true); setTimeout(() => setAdded(false), 1600); } }} className="flex items-center justify-center gap-2 rounded-full border-2 border-foreground py-4 text-sm font-bold transition active:scale-[.98] disabled:opacity-40">
          {added ? <><Check className="size-4" /> Added to cart</> : <><ShoppingBag className="size-4" /> {soldOut ? "Sold out" : "Add to cart"}</>}
        </button>
        <button disabled={soldOut} onClick={() => { const l = line(); if (l) { add(l); router.push(`${base}/cart`); } }} className="rounded-full bg-foreground py-4 text-sm font-bold text-background transition active:scale-[.98] disabled:opacity-40">Buy now</button>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${storeName}, I want to order: ${p.name}${key ? ` (${key})` : ""} × ${qty}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-4 text-sm font-bold text-white">
            <FaWhatsapp className="size-5" /> Order on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
