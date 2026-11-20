"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";

type Cat = { name: string; slug: string; children?: { name: string; slug: string }[] };

function SearchBox({ base, autoFocus, onDone }: { base: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); router.push(`${base}/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); onDone?.(); }} className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
      <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for products" enterKeyHint="search" className="h-10 w-full rounded-pill border border-transparent bg-foreground/[.05] pr-4 pl-11 text-sm outline-none transition placeholder:text-muted focus:border-foreground/15 focus:bg-background" />
    </form>
  );
}

/** Compact store header: logo · search · account · cart, with a category strip underneath. */
export function StoreHeader({ base, name, logo, categories }: { base: string; name: string; logo: string | null; categories: Cat[] }) {
  const { count, ready } = useCart();
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
  useEffect(() => { setMenu(false); setSearch(false); }, [path]);
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
        <div className="hidden max-w-md flex-1 md:block"><SearchBox base={base} /></div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button onClick={() => setSearch((s) => !s)} aria-label="Search" className="grid size-9 place-items-center rounded-full md:hidden">{search ? <X className="size-5" /> : <Search className="size-5" />}</button>
          <Link href={me ? `${base}/account` : `${base}/login?next=${encodeURIComponent(path || base || "/")}`} aria-label={me ? "My account" : "Log in"} className="grid size-9 place-items-center rounded-full hover:bg-foreground/5 sm:size-10">{me ? <span className="grid size-8 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">{me}</span> : <UserRound className="size-5" />}</Link>
          <Link href={`${base}/cart`} aria-label="Bag" className="relative grid size-9 place-items-center rounded-full hover:bg-foreground/5 sm:size-10">
            <ShoppingBag className="size-5" />
            {mounted && ready && count > 0 && <span className="absolute top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-[#ff3f6c] px-1 text-[10px] font-bold text-white">{count}</span>}
          </Link>
        </div>
      </div>
      {search && <div className="border-t border-border/70 px-3 py-2.5 md:hidden"><SearchBox base={base} autoFocus onDone={() => setSearch(false)} /></div>}
      {categories.length > 0 && (
        <div className="border-t border-border/70">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] sm:px-6">
            <Link href={`${base}/shop`} className={cn("shrink-0 rounded-pill px-3.5 py-1.5 text-[12.5px] font-semibold transition", path === `${base}/shop` && !activeCat ? "bg-foreground text-background" : "text-muted hover:text-foreground")}>All</Link>
            {categories.map((c) => <Link key={c.slug} href={`${base}/shop?c=${c.slug}`} className={cn("shrink-0 rounded-pill px-3.5 py-1.5 text-[12.5px] font-semibold transition", activeCat === c.slug ? "bg-foreground text-background" : "text-muted hover:text-foreground")}>{c.name}</Link>)}
          </div>
        </div>
      )}

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
