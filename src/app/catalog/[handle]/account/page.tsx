import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText, Package, Truck } from "lucide-react";
import { query } from "@/lib/server/db";
import { getStoreByHandle, storeBase } from "@/lib/server/catalog";
import { getUser } from "@/lib/server/users";
import { orderInvoicePath } from "@/lib/server/invoice";
import { ORDER_COLOR, ORDER_FLOW, ORDER_LABEL, PAY_COLOR, PAY_LABEL } from "@/lib/order-status";
import { StoreLogout } from "@/components/catalog/store-logout";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };
export const dynamic = "force-dynamic";

const parse = <T,>(v: unknown, d: T): T => (v == null ? d : typeof v === "string" ? (JSON.parse(v) as T) : (v as T));
const rupee = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const day = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** The shopper's orders from THIS store, inside the store's own look. */
export default async function StoreAccount({ params }: { params: Promise<{ handle: string }> }) {
  const raw = (await params).handle;
  const s = await getStoreByHandle(raw);
  if (!s) notFound();
  const base = storeBase(raw, s.handle);
  const u = await getUser();
  if (!u) redirect(`${base}/login?next=${encodeURIComponent(`${base}/account`)}`);
  const rows = await query<Record<string, unknown>>("SELECT order_no, items, subtotal, status, status_log, tracking, pay_method, pay_status, created_at FROM store_orders WHERE store_id=? AND customer_id=? ORDER BY id DESC LIMIT 100", [s.id, u.id]);
  const orders = rows.map((o) => ({
    no: String(o.order_no), subtotal: Number(o.subtotal), status: String(o.status), pay: String(o.pay_status), method: String(o.pay_method), at: String(o.created_at),
    items: parse<{ name: string; variant: string | null; qty: number; price: number }[]>(o.items, []),
    log: parse<{ s: string; at: string }[]>(o.status_log, []), tracking: parse<{ courier: string; number: string; url: string } | null>(o.tracking, null),
  }));
  const first = (u.name || "there").split(" ")[0];

  return (
    <section className="mx-auto max-w-4xl px-3 pt-6 sm:px-6 sm:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#0b0d12] px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-white text-lg font-extrabold text-black">{(u.name || "U").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
          <div><p className="text-xs text-white/55">Hello,</p><p className="font-display text-2xl font-extrabold">{first}</p><p className="text-xs text-white/55">{u.phone || u.email}</p></div>
        </div>
        <div className="flex gap-2"><Link href={`${base}/shop`} className="rounded-pill bg-white px-4 py-2 text-xs font-bold text-black">Continue shopping</Link><span className="[&_button]:border-white/20 [&_button]:text-white"><StoreLogout base={base} /></span></div>
      </div>

      <h1 className="mt-8 font-display text-2xl font-extrabold tracking-tight">My orders <span className="text-base font-semibold text-muted">· {orders.length}</span></h1>
      {orders.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-border p-12 text-center"><Package className="mx-auto size-9 text-muted" /><p className="mt-3 font-display text-lg font-bold">No orders yet</p><p className="mt-1 text-sm text-muted">When you order from {s.name}, it shows up here.</p><Link href={`${base}/shop`} className="mt-5 inline-block rounded-pill bg-foreground px-6 py-2.5 text-sm font-bold text-background">Start shopping</Link></div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((o) => {
            const cur = ORDER_FLOW.indexOf(o.status as (typeof ORDER_FLOW)[number]);
            const steps = ["new", "confirmed", "shipped", "delivered"] as const;
            const at = (st: string) => [...o.log].reverse().find((l) => l.s === st)?.at ?? (st === "new" ? o.at : undefined);
            return (
              <div key={o.no} className="rounded-3xl border border-border bg-card p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-display font-bold">Order #{o.no}</p><p className="text-xs text-muted">{day(o.at)} · {o.items.reduce((n, i) => n + i.qty, 0)} item(s)</p></div>
                  <p className="font-display text-lg font-extrabold">{rupee(o.subtotal)}</p>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} × ${i.qty}`).join(", ")}</p>
                {cur >= 0 && (
                  <ol className="mt-5 grid grid-cols-4">
                    {steps.map((st, k) => {
                      const done = ORDER_FLOW.indexOf(st) <= cur;
                      const t = at(st);
                      return (
                        <li key={st} className="relative flex flex-col items-center text-center">
                          {k > 0 && <span className={cn("absolute top-[9px] right-1/2 h-0.5 w-full", done ? "bg-emerald-500" : "bg-border")} />}
                          <span className={cn("relative z-10 size-5 rounded-full border-[3px]", done ? "border-emerald-500 bg-emerald-500" : "border-border bg-card")} />
                          <span className={cn("mt-1.5 text-[11px] font-semibold", !done && "text-muted")}>{ORDER_LABEL[st]}</span>
                          {done && t && <span className="text-[10px] text-muted">{new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
                        </li>
                      );
                    })}
                  </ol>
                )}
                {o.tracking?.number && <p className="mt-4 flex flex-wrap items-center gap-x-1.5 rounded-2xl bg-foreground/[.03] px-4 py-2.5 text-xs"><Truck className="size-4" /> {o.tracking.courier || "Courier"} · AWB <span className="font-mono font-semibold">{o.tracking.number}</span>{o.tracking.url && <a href={o.tracking.url} target="_blank" rel="noopener noreferrer" className="ml-auto font-bold underline">Track package</a>}</p>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("rounded-pill px-2.5 py-1 text-xs font-semibold", ORDER_COLOR[o.status])}>{ORDER_LABEL[o.status] ?? o.status}</span>
                    <span className={cn("rounded-pill px-2.5 py-1 text-xs font-semibold", PAY_COLOR[o.pay])}>{o.method === "cod" && o.pay === "pending" ? "Cash on delivery" : PAY_LABEL[o.pay] ?? o.pay}</span>
                  </div>
                  <a href={orderInvoicePath(o.no)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3.5 py-2 text-xs font-bold"><FileText className="size-3.5" /> Invoice</a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
