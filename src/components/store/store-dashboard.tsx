"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Home, Package, Settings2, Share2, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { card, imgUrl, inr } from "./ui";
import { ProductsPanel, type C, type P } from "./products-panel";
import { OrdersPanel, type O } from "./orders-panel";
import { SettingsPanel, type S } from "./settings-panel";

type Tab = "home" | "products" | "orders" | "settings";
type Sub = "profile" | "payments" | "pages";

export function StoreDashboard({ initialStore, initialProducts, initialCategories, initialOrders, initialTab, origin }: {
  initialStore: S; initialProducts: P[]; initialCategories: C[]; initialOrders: O[]; initialTab: Tab; origin: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sub, setSub] = useState<Sub>("profile");
  const [store, setStore] = useState(initialStore);
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [orders, setOrders] = useState(initialOrders);
  const [copied, setCopied] = useState(false);
  const link = `${origin}/catalog/@${store.handle}`;
  const newOrders = orders.filter((o) => o.status === "new").length;
  const revenue = orders.filter((o) => o.status !== "cancelled" && (o.pay_status === "verified" || o.pay_status === "paid")).reduce((n, o) => n + Number(o.subtotal), 0);

  const steps = [
    { done: Boolean(store.logo_key), label: "Add your logo", go: () => { setTab("settings"); setSub("profile"); } },
    { done: products.length > 0, label: "Add your first product", go: () => setTab("products") },
    { done: store.payments.upi.on || store.payments.cod, label: "Set up payments", go: () => { setTab("settings"); setSub("payments"); } },
    { done: Object.values(store.pages).some((p) => p.on), label: "Add store policies", go: () => { setTab("settings"); setSub("pages"); } },
  ];

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: store.name, url: link });
      else { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    } catch {}
  }

  const NAV: [Tab, string, typeof Home, number?][] = [["home", "Home", Home], ["products", "Products", Package], ["orders", "Orders", ShoppingBag, newOrders], ["settings", "Store", Settings2]];

  return (
    <section className="min-h-dvh px-4 pt-24 pb-32 sm:pb-16 md:pt-32">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <div className="flex items-center gap-3.5">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-card font-display text-lg font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {store.logo_key ? <img src={imgUrl(store.logo_key)!} alt="" className="size-full object-contain p-1" /> : store.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl">{store.name}</h1>
            <p className="truncate text-xs text-muted">@{store.handle} · {store.planName} plan · ID {store.code}</p>
          </div>
          <a href={link} target="_blank" rel="noopener" className="hidden items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold sm:inline-flex"><ExternalLink className="size-4" /> View store</a>
        </div>

        {/* desktop tabs */}
        <div className="mt-6 hidden gap-2 sm:flex">
          {NAV.map(([k, label, Icon, badge]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold", tab === k ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted")}>
              <Icon className="size-4" /> {label}{badge ? <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">{badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "home" && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[1.8rem] bg-[#0a0f1f] p-5 text-white sm:p-7">
                <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,.4),transparent)]" />
                <p className="relative text-xs font-bold tracking-[3px] text-white/60">YOUR STORE LINK</p>
                <p className="relative mt-2 font-display text-lg font-bold break-all sm:text-2xl">vishnuit.co.in/catalog/@{store.handle}</p>
                <div className="relative mt-5 grid grid-cols-3 gap-2 sm:flex">
                  <button onClick={share} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black"><Share2 className="size-4" /> Share</button>
                  <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}</button>
                  <a href={link} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold"><ExternalLink className="size-4" /> Open</a>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Products", `${products.length}${store.limit ? `/${store.limit}` : ""}`], ["New orders", String(newOrders)], ["Received", inr(revenue)]].map(([l, v]) => (
                  <div key={l} className={cn(card, "p-4")}><p className="text-[11px] font-semibold text-muted">{l}</p><p className="mt-1 truncate font-display text-xl font-extrabold">{v}</p></div>
                ))}
              </div>
              {steps.some((s) => !s.done) && (
                <div className={cn(card, "p-5")}>
                  <p className="font-display font-bold">Finish setting up</p>
                  <div className="mt-3 space-y-2">
                    {steps.map((s) => (
                      <button key={s.label} onClick={s.go} className="flex w-full items-center gap-3 rounded-2xl px-1 py-2 text-left">
                        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border")}>{s.done && <Check className="size-3.5" />}</span>
                        <span className={cn("text-sm font-medium", s.done && "text-muted line-through")}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className={cn(card, "flex items-center gap-4 p-5")}>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-600"><Sparkles className="size-5" /></span>
                <div className="flex-1"><p className="font-semibold">{store.planName} plan</p><p className="text-xs text-muted">{store.limit ? `Up to ${store.limit} products` : "Unlimited products"}{store.plan_expires_at ? ` · renews ${new Date(store.plan_expires_at).toLocaleDateString("en-IN")}` : ""}</p></div>
                <span className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted">Upgrade soon</span>
              </div>
            </div>
          )}
          {tab === "products" && <ProductsPanel products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} limit={store.limit} />}
          {tab === "orders" && <OrdersPanel orders={orders} setOrders={setOrders} />}
          {tab === "settings" && (
            <div>
              <div className="mb-4 grid grid-cols-3 rounded-full border border-border bg-card p-1 text-sm font-semibold">
                {([["profile", "Profile"], ["payments", "Payments"], ["pages", "Pages"]] as [Sub, string][]).map(([k, l]) => (
                  <button key={k} onClick={() => setSub(k)} className={cn("rounded-full py-2.5", sub === k ? "bg-foreground text-background" : "text-muted")}>{l}</button>
                ))}
              </div>
              <SettingsPanel key={sub} store={store} setStore={setStore} section={sub} />
            </div>
          )}
        </div>
        <p className="mt-10 text-center text-xs text-muted"><Link href="/account" className="hover:underline">← Back to my account</Link></p>
      </div>

      {/* phone bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {NAV.map(([k, label, Icon, badge]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold", tab === k ? "text-foreground" : "text-muted")}>
              <Icon className={cn("size-5", tab === k && "stroke-[2.4]")} />
              {label}
              {badge ? <span className="absolute top-0.5 right-[28%] rounded-full bg-red-500 px-1.5 text-[9px] text-white">{badge}</span> : null}
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}
