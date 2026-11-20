"use client";
import { useState } from "react";
import { ProductsPanel, type C, type P } from "@/components/store/products-panel";
import { OrdersPanel, type O } from "@/components/store/orders-panel";
import { SettingsPanel, type S } from "@/components/store/settings-panel";
import { cn } from "@/lib/utils";

export function ProductsPage({ products, categories, limit }: { products: P[]; categories: C[]; limit: number | null }) {
  const [p, setP] = useState(products);
  const [c, setC] = useState(categories);
  return <ProductsPanel products={p} setProducts={setP} categories={c} setCategories={setC} limit={limit} />;
}

export function OrdersPage({ orders, openId }: { orders: O[]; openId?: number }) {
  const [o, setO] = useState(orders);
  return <OrdersPanel orders={o} setOrders={setO} openId={openId} />;
}

type Sub = "profile" | "payments" | "pages" | "tax" | "reviews" | "delivery";
export function SettingsPage({ store, initialTab }: { store: S; initialTab: Sub }) {
  const [s, setS] = useState(store);
  const [tab, setTab] = useState<Sub>(initialTab);
  return (
    <div>
      <div className="mb-5 flex overflow-x-auto rounded-full border border-border bg-card p-1 text-[13px] font-semibold [scrollbar-width:none] sm:text-sm">
        {([["profile", "Profile"], ["payments", "Payments"], ["delivery", "Delivery"], ["tax", "GST & invoice"], ["reviews", "Reviews"], ["pages", "Pages"]] as [Sub, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex-1 shrink-0 rounded-full px-3.5 py-2.5 whitespace-nowrap", tab === k ? "bg-foreground text-background" : "text-muted")}>{l}</button>
        ))}
      </div>
      <SettingsPanel key={tab} store={s} setStore={(x) => setS((p) => ({ ...p, ...x }))} section={tab} />
    </div>
  );
}
