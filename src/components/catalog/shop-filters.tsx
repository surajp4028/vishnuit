"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Facets = {
  categories: { slug: string; name: string; count: number; depth?: number }[];
  options: { name: string; values: { v: string; count: number }[] }[];
  price: { min: number; max: number };
};
export type Applied = { c: string; f: string[]; min: string; max: string; stock: boolean; sort: string; q: string };

const SORTS: [string, string][] = [["", "Newest"], ["low", "Price: low to high"], ["high", "Price: high to low"], ["off", "Biggest discount"]];
const COLOR_HEX: Record<string, string> = { black: "#111", white: "#fff", red: "#d33", blue: "#2563eb", navy: "#1e2a5a", green: "#16a34a", yellow: "#facc15", pink: "#ec4899", maroon: "#7f1d1d", beige: "#e8dcc4", grey: "#9ca3af", gray: "#9ca3af", brown: "#7c4a21", orange: "#f97316", purple: "#7c3aed", gold: "#d4a017", silver: "#c0c0c0", cream: "#f5ecd7", mustard: "#d4a017", teal: "#0d9488", indigo: "#4338ca", blush: "#f4c2c2" };

function toQuery(a: Applied) {
  const u = new URLSearchParams();
  if (a.q) u.set("q", a.q);
  if (a.c) u.set("c", a.c);
  a.f.forEach((x) => u.append("f", x));
  if (a.min) u.set("min", a.min);
  if (a.max) u.set("max", a.max);
  if (a.stock) u.set("stock", "1");
  if (a.sort) u.set("sort", a.sort);
  const s = u.toString();
  return s ? `?${s}` : "";
}

/** Filter button + slide-in panel (right on desktop, full-height sheet on phones). */
export function ShopFilters({ facets, applied }: { facets: Facets; applied: Applied }) {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [a, setA] = useState<Applied>(applied);
  useEffect(() => setA(applied), [applied]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const count = (applied.c ? 1 : 0) + applied.f.length + (applied.min || applied.max ? 1 : 0) + (applied.stock ? 1 : 0);
  const go = (x: Applied) => { router.push(path + toQuery(x), { scroll: false }); setOpen(false); };
  const toggleF = (name: string, v: string) => { const k = `${name}:${v}`; setA((p) => ({ ...p, f: p.f.includes(k) ? p.f.filter((y) => y !== k) : [...p.f, k] })); };
  const chips = [
    ...(applied.c ? [{ k: "c", label: facets.categories.find((x) => x.slug === applied.c)?.name ?? applied.c, rm: { ...applied, c: "" } }] : []),
    ...applied.f.map((x) => ({ k: x, label: x.split(":").slice(1).join(":"), rm: { ...applied, f: applied.f.filter((y) => y !== x) } })),
    ...(applied.min || applied.max ? [{ k: "price", label: `₹${applied.min || facets.price.min} – ₹${applied.max || facets.price.max}`, rm: { ...applied, min: "", max: "" } }] : []),
    ...(applied.stock ? [{ k: "stock", label: "In stock", rm: { ...applied, stock: false } }] : []),
  ];

  return (
    <>
      <div className="flex items-center gap-2 border-y border-border/70 py-2.5">
        <button onClick={() => setOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-foreground/80 px-4 py-2 text-[13px] font-bold">
          <SlidersHorizontal className="size-4" /> Filters{count ? <span className="grid size-5 place-items-center rounded-full bg-foreground text-[10px] text-background">{count}</span> : null}
        </button>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
          {chips.map((c) => <button key={c.k} onClick={() => go(c.rm)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground/[.06] px-3 py-2 text-xs font-semibold">{c.label}<X className="size-3" /></button>)}
        </div>
        <select value={applied.sort} onChange={(e) => go({ ...applied, sort: e.target.value })} aria-label="Sort" className="shrink-0 rounded-full border border-border bg-background px-3 py-2 text-[13px] font-semibold outline-none">
          {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      <div className={cn("fixed inset-0 z-[90] transition", open ? "visible" : "invisible")}>
        <div onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} />
        <aside className={cn("absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out", open ? "translate-x-0" : "translate-x-full")}>
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="font-display text-xl font-extrabold">Filters</p>
            <button onClick={() => setOpen(false)} aria-label="Close filters" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5"><X className="size-5" /></button>
          </header>
          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
            <section>
              <p className="mb-3 text-[11px] font-bold tracking-[3px] text-muted">SORT BY</p>
              <div className="grid grid-cols-2 gap-2">
                {SORTS.map(([k, l]) => <button key={k} onClick={() => setA({ ...a, sort: k })} className={cn("rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold", a.sort === k ? "border-foreground bg-foreground text-background" : "border-border")}>{l}</button>)}
              </div>
            </section>

            {facets.categories.length > 0 && (
              <section>
                <p className="mb-3 text-[11px] font-bold tracking-[3px] text-muted">CATEGORY</p>
                <div className="space-y-1">
                  {[{ slug: "", name: "All products", count: 0, depth: 0 }, ...facets.categories].map((c) => (
                    <button key={c.slug || "all"} onClick={() => setA({ ...a, c: c.slug })} className={cn("flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[14.5px] hover:bg-foreground/[.04]", c.depth === 1 && "pl-8 text-[13.5px]")}>
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", a.c === c.slug ? "border-foreground" : "border-border")}>{a.c === c.slug && <span className="size-2.5 rounded-full bg-foreground" />}</span>
                      <span className={cn("flex-1", c.depth === 1 ? "text-muted" : "font-medium")}>{c.name}</span>{c.count > 0 && <span className="text-xs text-muted">{c.count}</span>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {facets.options.map((o) => {
              const isColor = /colou?r/i.test(o.name);
              return (
                <section key={o.name}>
                  <p className="mb-3 text-[11px] font-bold tracking-[3px] text-muted">{o.name.toUpperCase()}</p>
                  <div className="flex flex-wrap gap-2">
                    {o.values.map(({ v, count: n }) => {
                      const on = a.f.includes(`${o.name}:${v}`);
                      const hex = COLOR_HEX[v.toLowerCase()];
                      return (
                        <button key={v} disabled={!n && !on} onClick={() => toggleF(o.name, v)} className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition", on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40", !n && !on && "cursor-not-allowed text-muted line-through opacity-50")}>
                          {isColor && hex && <span className="size-4 rounded-full ring-1 ring-black/15" style={{ background: hex }} />}
                          {v}<span className={cn("text-[11px]", on ? "text-background/60" : "text-muted")}>{n}</span>
                          {on && <Check className="size-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {facets.price.max > facets.price.min && (
              <section>
                <p className="mb-3 text-[11px] font-bold tracking-[3px] text-muted">PRICE</p>
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 items-center rounded-xl border border-border px-3"><span className="text-muted">₹</span><input inputMode="numeric" value={a.min} onChange={(e) => setA({ ...a, min: e.target.value.replace(/\D/g, "") })} placeholder={String(facets.price.min)} className="w-full bg-transparent px-1.5 py-2.5 text-sm outline-none" /></label>
                  <span className="text-muted">–</span>
                  <label className="flex flex-1 items-center rounded-xl border border-border px-3"><span className="text-muted">₹</span><input inputMode="numeric" value={a.max} onChange={(e) => setA({ ...a, max: e.target.value.replace(/\D/g, "") })} placeholder={String(facets.price.max)} className="w-full bg-transparent px-1.5 py-2.5 text-sm outline-none" /></label>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[500, 1000, 2000, 5000].filter((x) => x > facets.price.min && x < facets.price.max * 1.5).map((x) => <button key={x} onClick={() => setA({ ...a, min: "", max: String(x) })} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", a.max === String(x) && !a.min ? "border-foreground bg-foreground text-background" : "border-border")}>Under ₹{x.toLocaleString("en-IN")}</button>)}
                </div>
              </section>
            )}

            <section>
              <p className="mb-3 text-[11px] font-bold tracking-[3px] text-muted">AVAILABILITY</p>
              <button onClick={() => setA({ ...a, stock: !a.stock })} className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-[14px] font-semibold">
                In stock only
                <span className={cn("relative h-6 w-11 rounded-full transition", a.stock ? "bg-foreground" : "bg-foreground/15")}><span className={cn("absolute top-1 size-4 rounded-full bg-background transition-all", a.stock ? "left-6" : "left-1")} /></span>
              </button>
            </section>
          </div>
          <footer className="grid grid-cols-2 gap-3 border-t border-border p-4">
            <button onClick={() => go({ c: "", f: [], min: "", max: "", stock: false, sort: "", q: a.q })} className="rounded-full border border-border py-3.5 text-sm font-bold">Clear all</button>
            <button onClick={() => go(a)} className="rounded-full bg-foreground py-3.5 text-sm font-bold text-background">Show results</button>
          </footer>
        </aside>
      </div>
    </>
  );
}
