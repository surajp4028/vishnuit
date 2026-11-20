import { requireSeller, storeOrders } from "@/lib/server/seller";

export const metadata = { title: "Sales & reports" };
const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default async function SellerSales({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { store } = await requireSeller();
  const days = [7, 30, 90].includes(Number((await searchParams).d)) ? Number((await searchParams).d) : 30;
  const all = await storeOrders(store.id, 5000);
  const from = Date.now() - days * 86400000;
  const orders = all.filter((o) => o.status !== "cancelled" && new Date(o.created_at).getTime() >= from);
  const revenue = orders.reduce((n, o) => n + o.subtotal, 0);
  const collected = orders.filter((o) => o.pay_status === "paid" || o.pay_status === "verified").reduce((n, o) => n + o.subtotal, 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const cancelled = all.filter((o) => o.status === "cancelled" && new Date(o.created_at).getTime() >= from).length;

  // daily series
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    return { key: d.toDateString(), label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), v: 0 };
  });
  for (const o of orders) { const b = buckets.find((x) => x.key === new Date(o.created_at).toDateString()); if (b) b.v += o.subtotal; }
  const max = Math.max(1, ...buckets.map((b) => b.v));

  const byProduct = new Map<string, { qty: number; v: number }>();
  for (const o of orders) for (const i of o.items) { const x = byProduct.get(i.name) ?? { qty: 0, v: 0 }; x.qty += i.qty; x.v += i.price * i.qty; byProduct.set(i.name, x); }
  const top = [...byProduct.entries()].sort((a, b) => b[1].v - a[1].v).slice(0, 8);
  const byMethod = ["cod", "upi", "razorpay"].map((m) => ({ m, v: orders.filter((o) => o.pay_method === m).reduce((n, o) => n + o.subtotal, 0) })).filter((x) => x.v > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Sales & reports</h1>
        <div className="flex rounded-full border border-border bg-card p-1 text-sm font-semibold">
          {[7, 30, 90].map((d) => <a key={d} href={`/seller/sales?d=${d}`} className={`rounded-full px-4 py-2 ${d === days ? "bg-foreground text-background" : "text-muted"}`}>{d} days</a>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Sales", inr(revenue)], ["Payment received", inr(collected)], ["Orders", String(orders.length)], ["Avg. order", inr(aov)]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-4 md:p-5"><p className="text-xs text-muted">{l}</p><p className="mt-1 truncate font-display text-2xl font-extrabold">{v}</p></div>
        ))}
      </div>
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="font-display font-bold">Daily sales</h2><p className="text-xs text-muted">{cancelled} cancelled</p></div>
        <div className="mt-5 flex h-44 items-end gap-[3px] overflow-x-auto">
          {buckets.map((b) => (
            <div key={b.key} className="group relative flex h-full min-w-[6px] flex-1 flex-col justify-end">
              <div className="rounded-t-md bg-accent/80 transition group-hover:bg-accent" style={{ height: `${Math.max(2, (b.v / max) * 100)}%` }} title={`${b.label}: ${inr(b.v)}`} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted"><span>{buckets[0].label}</span><span>{buckets[buckets.length - 1].label}</span></div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-bold">Top products</h2>
          {top.length === 0 ? <p className="mt-4 text-sm text-muted">No sales in this period.</p> : (
            <div className="mt-4 space-y-3">
              {top.map(([name, x]) => (
                <div key={name}>
                  <div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{name}</span><span className="shrink-0 font-semibold">{inr(x.v)} <span className="font-normal text-muted">· {x.qty} sold</span></span></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-foreground/10"><div className="h-full rounded-full bg-accent" style={{ width: `${(x.v / top[0][1].v) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-bold">By payment method</h2>
          {byMethod.length === 0 ? <p className="mt-4 text-sm text-muted">No sales in this period.</p> : (
            <div className="mt-4 space-y-3">
              {byMethod.map((x) => (
                <div key={x.m}><div className="flex justify-between text-sm"><span className="font-medium">{x.m === "cod" ? "Cash on delivery" : x.m === "upi" ? "UPI (direct)" : "Online (Razorpay)"}</span><span className="font-semibold">{inr(x.v)}</span></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-foreground/10"><div className="h-full rounded-full bg-[#d4a017]" style={{ width: `${(x.v / revenue) * 100}%` }} /></div></div>
              ))}
            </div>
          )}
          <a href="/api/store/orders/export" className="mt-6 inline-block rounded-full border border-border px-4 py-2 text-sm font-semibold">Download all orders (CSV)</a>
        </section>
      </div>
    </div>
  );
}
