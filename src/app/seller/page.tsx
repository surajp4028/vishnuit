import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { queryOne } from "@/lib/server/db";
import { effectivePlan } from "@/lib/server/catalog";
import { requireSeller, storeOrders } from "@/lib/server/seller";
import { StoreLinkCard } from "@/components/seller/widgets";

export const metadata = { title: "Dashboard" };

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const STATUS: Record<string, string> = { new: "bg-blue-500/10 text-blue-600", confirmed: "bg-violet-500/10 text-violet-600", shipped: "bg-amber-500/10 text-amber-600", delivered: "bg-emerald-500/10 text-emerald-600", cancelled: "bg-red-500/10 text-red-500" };

export default async function SellerHome() {
  const { user, store, cfg } = await requireSeller();
  const [orders, pc] = await Promise.all([
    storeOrders(store.id, 300),
    queryOne<{ n: number }>("SELECT COUNT(*) n FROM store_products WHERE store_id=?", [store.id]),
  ]);
  const live = orders.filter((o) => o.status !== "cancelled");
  const since = (d: number) => Date.now() - d * 86400000;
  const sum = (list: typeof live) => list.reduce((n, o) => n + o.subtotal, 0);
  const today = live.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const week = live.filter((o) => new Date(o.created_at).getTime() >= since(7));
  const month = live.filter((o) => new Date(o.created_at).getTime() >= since(30));
  const plan = cfg.plans[effectivePlan(store)];
  const products = Number(pc?.n ?? 0);
  const steps = [
    { done: !!store.logo_key, label: "Add your logo", href: "/seller/settings" },
    { done: products > 0, label: "Add your first product", href: "/seller/products" },
    { done: store.payments.cod || store.payments.upi.on, label: "Set up payments", href: "/seller/settings?tab=payments" },
    { done: Object.values(store.pages).some((p) => p.on), label: "Add store policies", href: "/seller/settings?tab=pages" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋 <span className="ml-1 rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-[11px] font-semibold">ID {store.code}</span></p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Dashboard</h1>
      </div>
      <StoreLinkCard handle={store.handle} name={store.name} domain={store.domain && store.domain_ok ? store.domain : null} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [TrendingUp, "Today", inr(sum(today)), `${today.length} order${today.length === 1 ? "" : "s"}`],
          [Wallet, "Last 30 days", inr(sum(month)), `${month.length} orders · 7d ${inr(sum(week))}`],
          [ShoppingBag, "New orders", String(orders.filter((o) => o.status === "new").length), `${orders.length} all time`],
          [Package, "Products", `${products}${plan.limit ? `/${plan.limit}` : ""}`, `${plan.name} plan`],
        ].map(([Icon, l, v, sub]) => {
          const I = Icon as typeof TrendingUp;
          return (
            <div key={l as string} className="rounded-2xl border border-border bg-card p-4 md:p-5">
              <div className="flex items-center justify-between"><p className="text-xs font-medium text-muted">{l as string}</p><I className="size-4 text-muted" /></div>
              <p className="mt-2 truncate font-display text-2xl font-extrabold">{v as string}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted">{sub as string}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="font-display font-bold">Recent orders</h2><Link href="/seller/orders" className="text-sm font-semibold text-accent">View all</Link></div>
          {orders.length === 0 ? <p className="p-8 text-center text-sm text-muted">No orders yet — share your store link to get started.</p> : (
            <div className="divide-y divide-border">
              {orders.slice(0, 6).map((o) => (
                <Link key={o.id} href={`/seller/orders?o=${o.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-foreground/[.02]">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{o.name}</p><p className="text-xs text-muted">#{o.order_no} · {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {o.pay_method.toUpperCase()}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS[o.status]}`}>{o.status}</span>
                  <p className="w-20 text-right text-sm font-bold">{inr(o.subtotal)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
        <div className="space-y-5">
          {steps.some((s) => !s.done) && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display font-bold">Finish setting up</h2>
              <div className="mt-3 space-y-1">
                {steps.map((s) => (
                  <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-xl px-1 py-2">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs ${s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"}`}>{s.done ? "✓" : ""}</span>
                    <span className={`flex-1 text-sm font-medium ${s.done ? "text-muted line-through" : ""}`}>{s.label}</span>
                    {!s.done && <ArrowRight className="size-4 text-muted" />}
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section className="rounded-2xl bg-[#0a0f1f] p-5 text-white">
            <p className="text-xs font-bold tracking-[3px] text-white/50">YOUR PLAN</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{plan.name}</p>
            <p className="mt-1 text-sm text-white/60">{plan.limit ? `${products}/${plan.limit} products used` : "Unlimited products"}{store.plan_expires_at ? ` · till ${new Date(store.plan_expires_at).toLocaleDateString("en-IN")}` : ""}</p>
            <Link href="/seller/billing" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">{effectivePlan(store) === "free" ? "Upgrade plan" : "Manage plan"} <ArrowRight className="size-4" /></Link>
          </section>
        </div>
      </div>
    </div>
  );
}
