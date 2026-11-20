"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeIndianRupee, Briefcase, ExternalLink, FileText, HelpCircle, Inbox, LayoutDashboard, LogOut, Megaphone, Menu, SlidersHorizontal, Store, TicketPercent, MessageSquareQuote, Settings, Sparkles, Star, Users, Wallet, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: boolean };
const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Main", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/leads", label: "Leads & Conversions", icon: Inbox, badge: true },
    { href: "/admin/landing-pages", label: "Landing Pages", icon: Megaphone },
    { href: "/admin/payments", label: "Payments & Clients", icon: Wallet },
  ] },
  { title: "Catalog", items: [
    { href: "/admin/stores", label: "Stores", icon: Store },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    { href: "/admin/catalog-settings", label: "Catalog Settings", icon: SlidersHorizontal },
  ] },
  { title: "Website content", items: [
    { href: "/admin/c/services", label: "Services", icon: Sparkles },
    { href: "/admin/c/projects", label: "Portfolio", icon: Briefcase },
    { href: "/admin/c/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { href: "/admin/c/posts", label: "Blog & News", icon: FileText },
    { href: "/admin/c/plans", label: "Pricing Plans", icon: BadgeIndianRupee },
    { href: "/admin/c/faqs", label: "FAQs", icon: HelpCircle },
    { href: "/admin/c/brands", label: "Brands & Partners", icon: Star },
  ] },
  { title: "System", items: [{ href: "/admin/settings", label: "Settings & Branding", icon: Settings }] },
];

export function AdminShell({ admin, newLeads, children }: { admin: { name: string; email: string }; newLeads: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (h: string) => (h === "/admin" ? pathname === "/admin" : pathname.startsWith(h));
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" className="relative h-10 w-[110px]">
          <Image src="/brand/vishnuit-vishnu-logo-white.png" alt="Vishnu IT" fill sizes="110px" className="object-contain object-left dark:hidden" />
          <Image src="/brand/vishnuit-vishnu-logo-black.png" alt="Vishnu IT" fill sizes="110px" className="hidden object-contain object-left dark:block" />
        </Link>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-3">
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-[2px] text-muted/70 uppercase">{g.title}</p>
            {g.items.map((n) => (
              <Link key={n.href} href={n.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition", active(n.href) ? "bg-accent text-white shadow-md shadow-accent/25" : "text-muted hover:bg-foreground/5 hover:text-foreground")}>
                <n.icon className="size-4" />
                <span className="flex-1">{n.label}</span>
                {n.badge && newLeads > 0 && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", active(n.href) ? "bg-white text-accent" : "bg-red-500 text-white")}>{newLeads}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"><ExternalLink className="size-4" /> View website</Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-red-500/10 hover:text-red-500"><LogOut className="size-4" /> Log out</button>
      </div>
    </div>
  );
  return (
    <div className="min-h-dvh bg-[#f6f7fb] dark:bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card transition-transform lg:hidden", open ? "translate-x-0" : "-translate-x-full")}>{sidebar}</aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/90 px-4 backdrop-blur md:px-8">
          <button className="grid size-9 place-items-center rounded-lg border border-border lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-4" /></button>
          <p className="hidden text-sm text-muted md:block">Welcome back, <span className="font-semibold text-foreground">{admin.name}</span> 👋</p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="grid size-9 place-items-center rounded-full bg-accent font-bold text-white">{admin.name[0]}</div>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
