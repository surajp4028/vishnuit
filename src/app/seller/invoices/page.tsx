import Link from "next/link";
import { FileText } from "lucide-react";
import { orderTax } from "@/lib/server/catalog";
import { requireSeller, storeOrders } from "@/lib/server/seller";

export const metadata = { title: "Invoices" };
const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

export default async function SellerInvoices() {
  const { store } = await requireSeller();
  const orders = (await storeOrders(store.id, 1000)).filter((o) => o.status !== "cancelled");
  const gst = orders.reduce((n, o) => n + orderTax(o.subtotal, store.tax).gst, 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Invoices</h1><p className="mt-1 text-sm text-muted">Every order gets an invoice in your name{store.tax.gstin ? ` with GSTIN ${store.tax.gstin}` : ""}. Customers see the same invoice in their account.</p></div>
        <Link href="/seller/settings?tab=tax" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">GST & invoice settings</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted">Invoices</p><p className="mt-1 font-display text-2xl font-extrabold">{orders.length}</p></div>
        <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted">Billed</p><p className="mt-1 font-display text-2xl font-extrabold">{inr(orders.reduce((n, o) => n + o.subtotal, 0))}</p></div>
        <div className="col-span-2 rounded-2xl border border-border bg-card p-4 md:col-span-1"><p className="text-xs text-muted">GST collected {store.tax.rate ? `(@${store.tax.rate}%)` : ""}</p><p className="mt-1 font-display text-2xl font-extrabold">{inr(gst)}</p></div>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        {orders.length === 0 ? <p className="p-10 text-center text-sm text-muted">No invoices yet.</p> : (
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{store.tax.invoicePrefix}-{o.order_no}</p><p className="truncate text-xs text-muted">{o.name} · {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
                <p className="text-sm font-bold">{inr(o.subtotal)}</p>
                <a href={o.invoice} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background"><FileText className="size-3.5" /> View</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
