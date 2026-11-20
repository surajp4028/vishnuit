import Link from "next/link";
import { imgUrl, type Product } from "@/lib/server/catalog";

const rupee = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

export function ProductCard({ p, base }: { p: Product; base: string }) {
  const img = imgUrl(p.images[0]);
  const second = imgUrl(p.images[1]);
  const off = p.compare_price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
  const soldOut = p.variants.length ? p.variants.every((v) => v.stock === 0) : p.stock === 0;
  return (
    <Link href={`${base}/p/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-foreground/[.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt={p.name} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.04]" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {second && <img src={second} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />}
        {off > 0 && !soldOut && <span className="absolute top-3 left-3 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-bold">{off}% OFF</span>}
        {soldOut && <span className="absolute top-3 left-3 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold text-background">SOLD OUT</span>}
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug">{p.name}</p>
      <p className="mt-1 text-[15px]"><b>{rupee(p.price)}</b>{p.compare_price ? <span className="ml-2 text-sm text-muted line-through">{rupee(p.compare_price)}</span> : null}</p>
    </Link>
  );
}
