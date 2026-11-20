"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, ExternalLink, FileText, Home, LayoutGrid, LogOut, Tags, MoreHorizontal, Package, Palette, Settings, ShoppingBag, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/seller", label: "Dashboard", icon: Home },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/categories", label: "Categories", icon: LayoutGrid },
  { href: "/seller/attributes", label: "Attributes", icon: Tags },
  { href: "/seller/orders", label: "Orders", icon: ShoppingBag, badge: true },
  { href: "/seller/sales", label: "Sales & reports", icon: BarChart3 },
  { href: "/seller/storefront", label: "Storefront", icon: Palette },
  { href: "/seller/invoices", label: "Invoices", icon: FileText },
  { href: "/seller/billing", label: "Plan & billing", icon: CreditCard },
  { href: "/seller/settings", label: "Settings", icon: Settings },
];
const BOTTOM = ["/seller", "/seller/products", "/seller/orders", "/seller/sales"];

type Props = { store: { name: string; handle: string; uid: string; logo: string | null; planName: string }; user: { name: string; avatar: string | null }; newOrders: number; children: React.ReactNode };

/** The seller's Vishnu ID (same as their account UID) — tap to copy, handy when talking to support. */
function UidChip({ uid, className = "" }: { uid: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" title="Your Vishnu ID — tap to copy" onClick={() => { navigator.clipboard?.writeText(uid).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}
      className={`items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[11px] font-semibold text-muted transition hover:text-foreground ${className.includes("hidden") ? "" : "inline-flex "}${className}`}>
      <span className="font-sans text-[10px] tracking-wider">ID</span>{copied ? "Copied ✓" : uid}
    </button>
  );
}

/** Seller panel chrome: sidebar on desktop, top bar + bottom tabs on phones. */
export function SellerShell({ store, user, newOrders, children }: Props) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);
  const active = (h: string) => (h === "/seller" ? path === "/seller" : path?.startsWith(h));
  const storeUrl = `/catalog/@${store.handle}`;
  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    window.location.href = "/";
  }
  const Avatar = ({ size = "size-9" }: { size?: string }) => (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-xs font-bold text-white", size)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : (user.name || "U").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
    </span>
  );
  const StoreMark = () => (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background text-xs font-bold">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {store.logo ? <img src={store.logo} alt="" className="size-full object-contain p-1" /> : store.name.slice(0, 2).toUpperCase()}
    </span>
  );

  return (
    <div className="min-h-dvh bg-[#f6f7fb] dark:bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <StoreMark />
          <div className="min-w-0"><p className="truncate font-display font-bold">{store.name}</p><p className="truncate text-xs text-muted">@{store.handle} · {store.planName}</p><UidChip uid={store.uid} className="mt-1" /></div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active(n.href) ? "bg-accent text-white shadow-md shadow-accent/25" : "text-muted hover:bg-foreground/5 hover:text-foreground")}>
              <n.icon className="size-4" /><span className="flex-1">{n.label}</span>
              {n.badge && newOrders > 0 && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", active(n.href) ? "bg-white text-accent" : "bg-red-500 text-white")}>{newOrders}</span>}
            </Link>
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-border p-3">
          <a href={storeUrl} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"><ExternalLink className="size-4" /> View my store</a>
          <Link href="/account" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"><UserRound className="size-4" /> My account</Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-red-500/10 hover:text-red-500"><LogOut className="size-4" /> Log out</button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:hidden"><StoreMark /><div className="min-w-0"><p className="truncate font-display text-[15px] font-bold">{store.name}</p><p className="truncate text-[11px] text-muted">{store.planName} plan · <span className="font-mono">{store.uid}</span></p></div></div>
          <Link href="/" className="relative hidden h-9 w-[100px] lg:block">
            <Image src="/brand/vishnuit-vishnu-logo-white.png" alt="Vishnu IT" fill sizes="100px" className="object-contain object-left dark:hidden" />
            <Image src="/brand/vishnuit-vishnu-logo-black.png" alt="Vishnu IT" fill sizes="100px" className="hidden object-contain object-left dark:block" />
          </Link>
          <div className="flex items-center gap-2">
            <UidChip uid={store.uid} className="hidden md:inline-flex" />
            <a href={storeUrl} target="_blank" rel="noopener" className="hidden items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-semibold sm:inline-flex"><ExternalLink className="size-4" /> View store</a>
            <ThemeToggle />
            <Link href="/account?tab=profile" aria-label="My account"><Avatar /></Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 md:px-8 md:pt-8 lg:pb-12">{children}</main>
      </div>

      {/* phone bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-1 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => BOTTOM.includes(n.href)).map((n) => (
            <Link key={n.href} href={n.href} className={cn("relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-semibold", active(n.href) ? "text-accent" : "text-muted")}>
              <n.icon className="size-5" />{n.label.split(" ")[0]}
              {n.badge && newOrders > 0 && <span className="absolute top-0 right-[22%] rounded-full bg-red-500 px-1.5 text-[9px] text-white">{newOrders}</span>}
            </Link>
          ))}
          <button onClick={() => setMore(true)} className={cn("flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-semibold", ["/seller/invoices", "/seller/billing", "/seller/settings"].some((h) => path?.startsWith(h)) ? "text-accent" : "text-muted")}>
            <MoreHorizontal className="size-5" />More
          </button>
        </div>
      </nav>
      {more && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden" onClick={() => setMore(false)}>
          <div className="w-full rounded-t-[1.8rem] bg-card p-4 pb-[max(16px,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between px-2"><p className="font-display font-bold">More</p><button onClick={() => setMore(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-foreground/5"><X className="size-4" /></button></div>
            {NAV.filter((n) => !BOTTOM.includes(n.href)).map((n) => (
              <Link key={n.href} href={n.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold", active(n.href) && "bg-foreground/5")}><n.icon className="size-5 text-muted" />{n.label}</Link>
            ))}
            <a href={storeUrl} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold"><ExternalLink className="size-5 text-muted" />View my store</a>
            <Link href="/account" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold"><UserRound className="size-5 text-muted" />My account</Link>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-red-500"><LogOut className="size-5" />Log out</button>
          </div>
        </div>
      )}
    </div>
  );
}
