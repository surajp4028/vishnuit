import Link from "next/link";
import { imgUrl, type Product } from "@/lib/server/catalog";
import { CardImages } from "./card-images";
import { hexFor, isColourOption, isLight } from "@/lib/colors";

const rupee = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

/** Fashion-style product tile: tall image, hover swap, tight price row with % off. */
export function ProductCard({ p, base, store }: { p: Product; base: string; store?: string }) {
  const off = p.compare_price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
  const soldOut = p.variants.length ? p.variants.every((v) => v.stock === 0) : p.stock === 0;
  const threshold = p.low_stock ?? 5;
  const left = p.variants.length ? (p.variants.some((v) => v.stock != null) ? p.variants.reduce((n, v) => n + (v.stock ?? 0), 0) : null) : p.stock;
  const lowStock = !soldOut && left != null && left > 0 && left <= threshold;
  return (
    <Link href={`${base}/p/${p.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-foreground/[.04] sm:rounded-2xl">
        <CardImages images={p.images.slice(0, 5).map((k) => imgUrl(k)!).filter(Boolean)} alt={p.name} dim={soldOut} />
        {soldOut && <span className="absolute inset-x-3 bottom-3 rounded-lg bg-background/95 py-1.5 text-center text-[11px] font-bold tracking-wider">SOLD OUT</span>}
        {lowStock && <span className="absolute bottom-3 left-3 rounded-md bg-background/95 px-2 py-1 text-[10px] font-bold text-[#ff3f6c]">Only {left} left</span>}
        {p.featured && !soldOut && <span className="absolute top-2.5 left-2.5 rounded-md bg-foreground/85 px-2 py-0.5 text-[10px] font-bold tracking-wider text-background">BESTSELLER</span>}
      </div>
      <div className="mt-2.5 px-0.5">
        {store && <p className="truncate text-[11px] font-bold tracking-wide text-foreground/90 uppercase">{store}</p>}
        <p className="truncate text-[13.5px] text-muted">{p.name}</p>
        {(() => {
          const c = p.options.find((o) => isColourOption(o.name));
          if (!c || c.values.length < 2) return null;
          return (
            <p className="mt-1.5 flex items-center gap-1">
              {c.values.slice(0, 5).map((v) => { const hex = hexFor(v, c.swatches) ?? "#ccc"; return <span key={v} title={v} className={`size-3 rounded-full ${isLight(hex) ? "ring-1 ring-black/20" : ""}`} style={{ background: hex }} />; })}
              {c.values.length > 5 && <span className="text-[11px] text-muted">+{c.values.length - 5}</span>}
            </p>
          );
        })()}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[13.5px]">
          <b className="text-foreground">{rupee(p.price)}</b>
          {p.compare_price ? <><span className="text-xs text-muted line-through">{rupee(p.compare_price)}</span><span className="text-xs font-semibold text-[#ff905a]">({off}% OFF)</span></> : null}
        </p>
      </div>
    </Link>
  );
}
