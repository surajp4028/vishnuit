"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { Loader2, Menu, Minus, Plus, Search, ShoppingBag, Trash2, UserRound, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { rupee, useCart } from "./cart";

export type MenuPick = { name: string; slug: string; price: number; compare: number | null; image: string | null };
type Cat = { name: string; slug: string; children?: { name: string; slug: string }[]; picks?: MenuPick[] };

type Hit = { name: string; slug: string; price: number; compare: number | null; image: string | null };

/** Search field with live product suggestions after 3 letters (Enter still opens the full results). */
function SearchBox({ base, handle, autoFocus, onDone }: { base: string; handle: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLFormElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  // Debounced lookup; older answers are ignored if the shopper kept typing.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) { setHits(null); setLoading(false); return; }
    let live = true;
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/catalog/@${handle}/search?q=${encodeURIComponent(term)}`).then((r) => r.json()).then((j: { items?: Hit[] }) => { if (live) { setHits(j.items ?? []); setLoading(false); } }).catch(() => live && setLoading(false));
    }, 220);
    return () => { live = false; clearTimeout(t); };
  }, [q, handle]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (href: string) => { setOpen(false); onDone?.(); router.push(href); };
  const show = open && q.trim().length >= 3;
  return (
    <form ref={box} onSubmit={(e) => { e.preventDefault(); go(`${base}/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }} className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
      <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} placeholder="Search for products" enterKeyHint="search" autoComplete="off" role="combobox" aria-expanded={show} aria-controls="store-search-list" className="h-10 w-full rounded-pill border border-transparent bg-foreground/[.05] pr-10 pl-11 text-sm outline-none transition placeholder:text-muted focus:border-foreground/15 focus:bg-background" />
      {loading && <Loader2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-muted" />}
      {show && hits && (
        <div id="store-search-list" role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background shadow-[0_20px_50px_-15px_rgba(0,0,0,.25)]">
          {hits.length ? (
            <>
              <div className="max-h-[min(360px,60vh)] overflow-y-auto overscroll-contain py-1.5">
                {hits.map((h) => (
                  <button type="button" role="option" aria-selected={false} key={h.slug} onClick={() => go(`${base}/p/${h.slug}`)} className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-foreground/[.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {h.image ? <img src={h.image} alt="" className="size-11 shrink-0 rounded-lg object-cover" /> : <span className="size-11 shrink-0 rounded-lg bg-foreground/5" />}
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold">{h.name}</span><span className="text-[12.5px] font-bold">{rupee(h.price)}</span>{h.compare && h.compare > h.price && <span className="ml-1.5 text-[11.5px] text-muted line-through">{rupee(h.compare)}</span>}</span>
                  </button>
                ))}
              </div>
              <button type="submit" className="block w-full border-t border-border px-4 py-2.5 text-left text-[12.5px] font-bold">See all results for “{q.trim()}” →</button>
            </>
          ) : <p className="px-4 py-4 text-sm text-muted">No products match “{q.trim()}”.</p>}
        </div>
      )}
    </form>
  );
}

/**
 * Category strip under the header. On desktop, hovering a category opens a blurred mega panel:
 * its sub-categories on the left and 2 trending products on the right ("All" shows every category + one pick).
 */
function CategoryBar({ base, path, activeCat, categories, allPick }: { base: string; path: string | null; activeCat: string | null; categories: Cat[]; allPick: MenuPick | null }) {
  const [hover, setHover] = useState<string | null>(null); // "" = All
  const timer = useRef<number>(0);
  const openSoon = (k: string) => { clearTimeout(timer.current); timer.current = window.setTimeout(() => setHover(k), 120); };
  const closeSoon = () => { clearTimeout(timer.current); timer.current = window.setTimeout(() => setHover(null), 180); };
  useEffect(() => { setHover(null); }, [path]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const cat = hover ? categories.find((c) => c.slug === hover) : null;
  const pill = (on: boolean) => cn("relative shrink-0 rounded-pill px-3.5 py-1.5 text-[12.5px] font-semibold transition", on ? "bg-foreground text-background" : "text-muted hover:text-foreground");
  return (
    <div className="relative border-t border-border/70" onMouseLeave={closeSoon}>
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] sm:px-6">
        <Link href={`${base}/shop`} onMouseEnter={() => openSoon("")} className={pill((path === `${base}/shop` && !activeCat) || hover === "")}>All</Link>
        {categories.map((c) => <Link key={c.slug} href={`${base}/shop?c=${c.slug}`} onMouseEnter={() => openSoon(c.slug)} className={pill(activeCat === c.slug || hover === c.slug)}>{c.name}</Link>)}
      </div>
      {hover != null && <div aria-hidden onMouseEnter={closeSoon} className="absolute inset-x-0 top-full z-20 hidden h-screen animate-[fadeIn_.2s_ease] bg-black/25 backdrop-blur-[3px] md:block" />}
      {hover != null && (
        <div onMouseEnter={() => clearTimeout(timer.current)} className="absolute inset-x-0 top-full z-30 hidden animate-[fadeIn_.18s_ease] border-b border-border/70 bg-background/[.97] shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)] backdrop-blur-2xl md:block">
          <div className="mx-auto grid h-[330px] max-w-7xl grid-cols-[minmax(0,1fr)_auto] gap-10 px-6 py-7">
            {cat ? (
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[4px] text-muted">SHOP</p>
                <Link href={`${base}/shop?c=${cat.slug}`} className="group mt-1 inline-flex items-center gap-3 font-display text-4xl font-extrabold tracking-tight">{cat.name}<span className="grid size-9 place-items-center rounded-full border border-border transition group-hover:translate-x-1 group-hover:border-foreground"><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span></Link>
                {cat.children?.length ? (
                  <div className="mt-6 grid max-w-xl grid-cols-2 gap-x-8 gap-y-1">
                    <Link href={`${base}/shop?c=${cat.slug}`} className="rounded-lg py-1.5 text-[15px] font-semibold hover:text-foreground">All {cat.name}</Link>
                    {cat.children.map((k) => <Link key={k.slug} href={`${base}/shop?c=${k.slug}`} className="rounded-lg py-1.5 text-[15px] text-muted transition hover:translate-x-0.5 hover:text-foreground">{k.name}</Link>)}
                  </div>
                ) : <p className="mt-4 max-w-sm text-sm text-muted">Explore everything in {cat.name} — new arrivals, bestsellers and more.</p>}
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[4px] text-muted">BROWSE</p>
                <Link href={`${base}/shop`} className="mt-1 inline-block font-display text-4xl font-extrabold tracking-tight">Everything</Link>
                <div className="mt-6 grid max-h-[190px] grid-cols-3 gap-x-8 gap-y-5 overflow-y-auto pr-2 lg:grid-cols-4">
                  {categories.map((c) => (
                    <div key={c.slug} className="min-w-0">
                      <Link href={`${base}/shop?c=${c.slug}`} className="block truncate text-[14px] font-bold hover:underline">{c.name}</Link>
                      {c.children?.slice(0, 4).map((k) => <Link key={k.slug} href={`${base}/shop?c=${k.slug}`} className="mt-1 block truncate text-[13px] text-muted hover:text-foreground">{k.name}</Link>)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4">
              {(cat ? cat.picks ?? [] : allPick ? [allPick] : []).map((p, i) => (
                <Link key={p.slug} href={`${base}/p/${p.slug}`} className="group relative block h-full w-[205px] overflow-hidden rounded-2xl bg-foreground/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image && <img src={p.image} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0" />
                  <span className="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-black">{cat ? (i === 0 ? "TRENDING" : "HOT NOW") : "EDITOR'S PICK"}</span>
                  <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                    <span className="line-clamp-2 text-[13.5px] leading-snug font-semibold">{p.name}</span>
                    <span className="mt-1 flex items-baseline gap-1.5 text-[13px]"><b>{rupee(p.price)}</b>{p.compare && p.compare > p.price && <span className="text-[11.5px] text-white/60 line-through">{rupee(p.compare)}</span>}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Slide-in bag: what's added, quantities, subtotal, then View bag / Checkout. */
function CartDrawer({ base, onClose }: { base: string; onClose: () => void }) {
  const { lines, total, count, setQty, remove } = useCart();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = o; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="absolute inset-0 animate-[fadeIn_.2s_ease] bg-black/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex h-dvh w-full max-w-[420px] animate-[slideInRight_.28s_cubic-bezier(.2,.8,.2,1)] flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-display text-lg font-extrabold">Your bag {count > 0 && <span className="text-sm font-semibold text-muted">({count} item{count === 1 ? "" : "s"})</span>}</p>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-foreground/5"><X className="size-5" /></button>
        </div>
        {lines.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-foreground/5"><ShoppingBag className="size-7 text-muted" /></span>
              <p className="mt-4 font-display text-lg font-bold">Your bag is empty</p>
              <p className="mt-1 text-sm text-muted">Add something you love.</p>
              <Link href={`${base}/shop`} onClick={onClose} className="mt-5 inline-block rounded-pill bg-foreground px-6 py-3 text-[13px] font-bold tracking-wide text-background uppercase">Start shopping</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-border overflow-y-auto overscroll-contain px-5">
              {lines.map((l, i) => (
                <div key={`${l.id}-${l.variant}`} className="flex gap-3.5 py-4">
                  <Link href={`${base}/p/${l.slug}`} onClick={onClose} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image ? <img src={l.image} alt="" className="h-24 w-[72px] rounded-xl object-cover" /> : <span className="block h-24 w-[72px] rounded-xl bg-foreground/5" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`${base}/p/${l.slug}`} onClick={onClose} className="line-clamp-2 text-[13.5px] leading-snug font-semibold">{l.name}</Link>
                    {l.variant && <p className="mt-0.5 text-xs text-muted">{l.variant}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => setQty(i, l.qty - 1)} disabled={l.qty <= 1} aria-label="Less" className="grid size-8 place-items-center disabled:opacity-30"><Minus className="size-3.5" /></button>
                        <span className="w-6 text-center text-[13px] font-bold">{l.qty}</span>
                        <button onClick={() => setQty(i, l.qty + 1)} aria-label="More" className="grid size-8 place-items-center"><Plus className="size-3.5" /></button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold">{rupee(l.price * l.qty)}</span>
                        <button onClick={() => remove(i)} aria-label={`Remove ${l.name}`} className="grid size-8 place-items-center rounded-full text-muted hover:bg-foreground/5 hover:text-red-500"><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Subtotal</span><span className="font-display text-xl font-extrabold">{rupee(total)}</span></div>
              <p className="mt-0.5 text-xs text-muted">Delivery and taxes are shown at checkout.</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link href={`${base}/cart`} onClick={onClose} className="grid h-12 place-items-center rounded-pill border-2 border-foreground text-[13px] font-bold tracking-wide uppercase">View bag</Link>
                <Link href={`${base}/cart#address`} onClick={onClose} className="grid h-12 place-items-center rounded-pill bg-foreground text-[13px] font-bold tracking-wide text-background uppercase">Checkout</Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/** Compact store header: logo · search · account · cart, with a category strip underneath. */
export function StoreHeader({ base, handle, name, logo, categories, allPick }: { base: string; handle: string; name: string; logo: string | null; categories: Cat[]; allPick?: MenuPick | null }) {
  const { count, ready, open: bagOpen, setOpen: setBag } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/account/me").then((r) => r.json()).then((j) => { const n: string = j?.user?.name || ""; if (j?.user) setMe(n.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "ME"); }).catch(() => {});
  }, []);
  const path = usePathname();
  const sp = useSearchParams();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  useEffect(() => { setMenu(false); setSearch(false); setBag(false); }, [path, setBag]);
  const links: [string, string][] = [["", "Home"], ["/shop", "Shop all"], ["/about", "About"], ["/contact", "Contact"]];
  const activeCat = path === `${base}/shop` ? sp.get("c") : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:h-16 sm:gap-5 sm:px-6">
        <button onClick={() => setMenu(true)} aria-label="Menu" className="grid size-9 shrink-0 place-items-center rounded-full md:hidden"><Menu className="size-5" /></button>
        <Link href={base || "/"} className="flex min-w-0 shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={name} className="h-8 w-auto max-w-[130px] object-contain sm:h-9" /> : <span className="truncate font-display text-[17px] font-extrabold tracking-tight sm:text-xl">{name}</span>}
        </Link>
        <nav className="hidden items-center gap-6 text-[13px] font-semibold tracking-wide md:flex">
          {links.slice(0, 2).map(([h, l]) => <Link key={l} href={base + h || "/"} className={cn("uppercase transition hover:text-foreground", (h === "" ? path === (base || "/") : path?.startsWith(base + h)) ? "text-foreground" : "text-muted")}>{l}</Link>)}
        </nav>
        <div className="hidden max-w-md flex-1 md:block"><SearchBox base={base} handle={handle} /></div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button onClick={() => setSearch((s) => !s)} aria-label="Search" className="grid size-9 place-items-center rounded-full md:hidden">{search ? <X className="size-5" /> : <Search className="size-5" />}</button>
          <Link href={me ? `${base}/account` : `${base}/login?next=${encodeURIComponent(path || base || "/")}`} aria-label={me ? "My account" : "Log in"} className="grid size-9 place-items-center rounded-full hover:bg-foreground/5 sm:size-10">{me ? <span className="grid size-8 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">{me}</span> : <UserRound className="size-5" />}</Link>
          <button type="button" onClick={() => setBag(true)} aria-label="Open bag" className="relative grid size-9 place-items-center rounded-full hover:bg-foreground/5 sm:size-10">
            <ShoppingBag className="size-5" />
            {mounted && ready && count > 0 && <span className="absolute top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-[#ff3f6c] px-1 text-[10px] font-bold text-white">{count}</span>}
          </button>
        </div>
      </div>
      {search && <div className="border-t border-border/70 px-3 py-2.5 md:hidden"><SearchBox base={base} handle={handle} autoFocus onDone={() => setSearch(false)} /></div>}
      {categories.length > 0 && <CategoryBar base={base} path={path} activeCat={activeCat} categories={categories} allPick={allPick ?? null} />}

      {bagOpen && mounted && createPortal(<CartDrawer base={base} onClose={() => setBag(false)} />, document.body)}
      {/* Rendered into <body>: the header's backdrop-blur would otherwise clip a fixed drawer to the header's height. */}
      {menu && mounted && createPortal((
        <div className="fixed inset-0 z-[95] md:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 left-0 h-dvh w-[82%] max-w-xs overflow-y-auto bg-background p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><span className="truncate font-display text-lg font-extrabold">{name}</span><button onClick={() => setMenu(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full"><X className="size-5" /></button></div>
            <nav className="mt-6 space-y-1">
              {links.map(([h, l]) => <Link key={l} href={base + h || "/"} className="block rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-foreground/5">{l}</Link>)}
              <Link href={me ? `${base}/account` : `${base}/login?next=${encodeURIComponent(path || base || "/")}`} className="block rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-foreground/5">{me ? "My orders" : "Log in / Sign up"}</Link>
            </nav>
            {categories.length > 0 && <>
              <p className="mt-6 px-3 text-[11px] font-bold tracking-[2px] text-muted">CATEGORIES</p>
              <nav className="mt-2 space-y-1">{categories.map((c) => (
                <div key={c.slug}>
                  <Link href={`${base}/shop?c=${c.slug}`} className="block rounded-xl px-3 py-2.5 text-[15px] font-semibold hover:bg-foreground/5">{c.name}</Link>
                  {c.children?.map((k) => <Link key={k.slug} href={`${base}/shop?c=${k.slug}`} className="ml-3 block border-l border-border py-2 pr-3 pl-4 text-[14px] text-muted hover:text-foreground">{k.name}</Link>)}
                </div>
              ))}</nav>
            </>}
          </aside>
        </div>
      ), document.body)}
    </header>
  );
}

export function WhatsAppFloat({ number, store }: { number: string; store: string }) {
  const path = usePathname();
  // Product and cart pages have their own sticky bottom bar on phones.
  const hideOnPhone = /\/(p\/[^/]+|cart)$/.test(path);
  if (!number) return null;
  return (
    <a href={`https://wa.me/${number}?text=${encodeURIComponent(`Hi ${store}, I have a question.`)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={`${hideOnPhone ? "max-sm:hidden " : ""}fixed right-4 bottom-5 z-40 grid size-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,.7)] sm:size-14`}>
      <FaWhatsapp className="size-6 sm:size-7" />
    </a>
  );
}
