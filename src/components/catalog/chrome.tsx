"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";

/** Store header: logo/name, links, cart. */
export function StoreHeader({ base, name, logo }: { base: string; name: string; logo: string | null }) {
  const { count, ready } = useCart();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const links = [["", "Home"], ["/shop", "Shop"], ["/about", "About"], ["/contact", "Contact"]];
  const active = (h: string) => (h === "" ? path === base || path === `${base}/` : path?.startsWith(base + h));
  return (
    <header className={cn("sticky top-0 z-40 border-b transition", scrolled ? "border-border bg-background/90 backdrop-blur-xl" : "border-transparent bg-background")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-20 sm:px-6">
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="grid size-10 place-items-center rounded-full md:hidden">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <Link href={base} className="flex min-w-0 flex-1 items-center gap-2.5 md:flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={name} className="h-9 w-auto max-w-[150px] object-contain sm:h-11" /> : <span className="truncate font-display text-lg font-extrabold tracking-tight sm:text-xl">{name}</span>}
        </Link>
        <nav className="hidden flex-1 justify-center gap-1 md:flex">
          {links.map(([h, l]) => <Link key={l} href={base + h} className={cn("rounded-full px-4 py-2 text-sm font-medium transition", active(h) ? "text-foreground" : "text-muted hover:text-foreground")}>{l}</Link>)}
        </nav>
        <Link href={`${base}/cart`} aria-label="Cart" className="relative grid size-11 place-items-center rounded-full border border-border">
          <ShoppingBag className="size-5" />
          {ready && count > 0 && <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">{count}</span>}
        </Link>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
          {links.map(([h, l]) => <Link key={l} href={base + h} className={cn("block rounded-2xl px-4 py-3.5 text-base font-semibold", active(h) ? "bg-foreground/5" : "")}>{l}</Link>)}
        </nav>
      )}
    </header>
  );
}

export function WhatsAppFloat({ number, store }: { number: string; store: string }) {
  if (!number) return null;
  return (
    <a href={`https://wa.me/${number}?text=${encodeURIComponent(`Hi ${store}, I have a question.`)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="fixed right-4 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl">
      <FaWhatsapp className="size-7" />
    </a>
  );
}
