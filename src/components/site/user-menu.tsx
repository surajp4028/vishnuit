"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Receipt, ShoppingBag, Store, UserCog, UserRound } from "lucide-react";

type Me = { uid: string; name: string; email: string | null; avatar: string | null; storeLink?: boolean; hasStore?: boolean } | null;

/** Header profile icon: login link when signed out; photo + hover menu when signed in. */
export function UserMenu() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/account/me", { cache: "no-store" }).then((r) => r.json()).then((j) => setMe(j.user ?? null)).catch(() => setMe(null));
  }, [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (me === undefined) return <span className="size-9 rounded-full border border-border bg-card/60" aria-hidden />;
  if (!me)
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname || "/account")}`} aria-label="Login" className="grid size-9 place-items-center rounded-full border border-border bg-card/60 transition hover:border-foreground/40">
        <UserRound className="size-4" />
      </Link>
    );

  const initials = (me.name || me.email || "U").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Account menu" className="grid size-9 place-items-center overflow-hidden rounded-full bg-accent text-white text-xs font-bold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {me.avatar ? <img src={me.avatar} alt="" className="size-full object-cover" /> : initials}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 pt-2">
          <div className="w-60 rounded-2xl border border-border bg-background p-2 shadow-2xl">
            <div className="border-b border-border px-3 pt-2 pb-3">
              <p className="truncate text-sm font-semibold">{me.name || "My account"}</p>
              <p className="truncate text-xs text-muted">{me.email ?? me.uid}</p>
            </div>
            {[["/account", "Dashboard", LayoutDashboard], ...(me.hasStore ? [["/seller", "Seller dashboard", Store]] : me.storeLink ? [["/account/store", "Create online store", Store]] : []), ["/account?tab=orders", "My orders", ShoppingBag], ["/account?tab=payments", "Payments & invoices", Receipt], ["/account?tab=profile", "Profile & password", UserCog]].map(([href, label, Icon]) => {
              const I = Icon as typeof LayoutDashboard;
              return (
                <Link key={href as string} href={href as string} className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-foreground/5">
                  <I className="size-4 text-muted" /> {label as string}
                </Link>
              );
            })}
            <button onClick={logout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-500/10">
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
