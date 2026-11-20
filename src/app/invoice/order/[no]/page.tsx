import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/server/db";
import { hydrateStore, imgUrl, orderTax, type OrderQuote } from "@/lib/server/catalog";
import { orderInvoiceTokenOk } from "@/lib/server/invoice";
import { stateName } from "@/lib/gst-states";
import { PrintButton } from "@/components/site/print-button";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Item = { name: string; variant: string | null; price: number; qty: number; gst_rate?: number | null; hsn?: string | null };
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

/** Tax invoice for a shop order — issued by the merchant (their GSTIN), not by Vishnu IT. */
export default async function OrderInvoice({ params, searchParams }: { params: Promise<{ no: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ no }, { t = "" }] = await Promise.all([params, searchParams]);
  const orderNo = decodeURIComponent(no);
  if (!orderInvoiceTokenOk(orderNo, t)) notFound();
  const o = await queryOne<Record<string, unknown>>("SELECT * FROM store_orders WHERE order_no=?", [orderNo]);
  if (!o) notFound();
  const sr = await queryOne<Record<string, unknown>>("SELECT * FROM stores WHERE id=?", [o.store_id]);
  if (!sr) notFound();
  const s = hydrateStore(sr);
  const items = (typeof o.items === "string" ? JSON.parse(o.items) : o.items) as Item[];
  // `subtotal` is what the shopper paid. New orders carry the exact breakdown taken at checkout;
  // older ones are treated as GST-inclusive so the invoice never shows more than was charged.
  const subtotal = Number(o.subtotal);
  const q: OrderQuote | null = o.tax ? (typeof o.tax === "string" ? JSON.parse(o.tax) : (o.tax as OrderQuote)) : null;
  const legacy = orderTax(subtotal, { ...s.tax, inclusive: true });
  const tx = q ? { rate: q.rate, taxable: q.taxable, gst: q.gst, total: subtotal, shipping: q.shipping, igst: q.igst } : { ...legacy, total: subtotal, shipping: 0, igst: false };
  // Tax per rate (products can have different GST slabs). Old orders: one line at the store rate.
  const rates = (q?.rates ?? (legacy.rate ? [{ rate: legacy.rate, taxable: legacy.taxable, gst: legacy.gst }] : [])).filter((g) => g.rate > 0);
  const showHsn = Boolean(s.tax.hsn) || items.some((i) => i.hsn);
  const showRate = rates.length > 0;
  const paid = o.pay_status === "paid" || o.pay_status === "verified";
  const date = new Date(String(o.created_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const logo = imgUrl(s.logo_key);

  return (
    <main className="min-h-dvh bg-[#f3f5f9] px-3 py-6 text-[#0a0f1f] sm:px-4 sm:py-8 print:bg-white print:p-0">
      <style>{`@page{size:A4;margin:14mm} @media print{.no-print{display:none!important}}`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3"><p className="text-sm text-[#5b6475]">Order #{orderNo}</p><PrintButton /></div>
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-[0_30px_80px_-40px_rgba(10,15,31,.35)] sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#e6e9f0] pb-6">
          <div className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt={s.name} className="h-12 w-auto max-w-[180px] object-contain" /> : <p className="font-display text-2xl font-extrabold">{s.name}</p>}
            <p className="mt-3 text-sm font-semibold">{s.tax.legalName || s.name}</p>
            <p className="mt-0.5 max-w-xs text-sm leading-relaxed whitespace-pre-line text-[#5b6475]">{s.contact.address}{s.contact.phone ? `\n${s.contact.phone}` : ""}{s.contact.email ? ` · ${s.contact.email}` : ""}</p>
            {s.tax.gstin && <p className="mt-1 text-sm font-semibold">GSTIN: {s.tax.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{rates.length ? "TAX INVOICE" : "INVOICE"}</p>
            <p className="mt-2 text-sm text-[#5b6475]">No. <b className="text-[#0a0f1f]">{s.tax.invoicePrefix}-{orderNo}</b></p>
            <p className="text-sm text-[#5b6475]">Date <b className="text-[#0a0f1f]">{date}</b></p>
            <span className={`mt-3 inline-block rounded-full border-2 px-4 py-1 text-xs font-extrabold tracking-[3px] ${paid ? "border-emerald-600 text-emerald-600" : "border-amber-500 text-amber-600"}`}>{paid ? "PAID" : o.pay_method === "cod" ? "CASH ON DELIVERY" : "PAYMENT PENDING"}</span>
          </div>
        </header>
        <section className="grid gap-5 py-6 sm:grid-cols-2">
          <div><p className="text-xs font-bold tracking-[2px] text-[#5b6475]">BILL / SHIP TO{o.state ? ` · PLACE OF SUPPLY: ${stateName(String(o.state)).toUpperCase()} (${String(o.state)})` : ""}</p><p className="mt-2 font-semibold">{String(o.name)}</p><p className="text-sm whitespace-pre-line text-[#5b6475]">{String(o.address ?? "")}{"\n"}{String(o.phone)}{o.email ? ` · ${o.email}` : ""}</p></div>
          <div className="sm:text-right"><p className="text-xs font-bold tracking-[2px] text-[#5b6475]">PAYMENT</p><p className="mt-2 text-sm">{o.pay_method === "cod" ? "Cash on delivery" : o.pay_method === "razorpay" ? "Online (Razorpay)" : "UPI"}</p>{o.utr ? <p className="text-sm text-[#5b6475]">Ref: <span className="font-mono">{String(o.utr)}</span></p> : null}</div>
        </section>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead><tr className="bg-[#f5f7fb] text-left text-[11px] tracking-[1.5px] text-[#5b6475]"><th className="rounded-l-xl px-3 py-3">ITEM</th>{showHsn && <th className="px-3 py-3">HSN</th>}{showRate && <th className="px-3 py-3 text-center">GST</th>}<th className="px-3 py-3 text-center">QTY</th><th className="px-3 py-3 text-right">RATE</th><th className="rounded-r-xl px-3 py-3 text-right">AMOUNT</th></tr></thead>
            <tbody>{items.map((i, k) => (
              <tr key={k} className="border-b border-[#e6e9f0]"><td className="px-3 py-3.5 font-medium">{i.name}{i.variant ? <span className="text-[#5b6475]"> · {i.variant}</span> : null}</td>{showHsn && <td className="px-3 py-3.5">{i.hsn || s.tax.hsn || "—"}</td>}{showRate && <td className="px-3 py-3.5 text-center">{i.gst_rate ?? s.tax.rate}%</td>}<td className="px-3 py-3.5 text-center">{i.qty}</td><td className="px-3 py-3.5 text-right">{money(i.price)}</td><td className="px-3 py-3.5 text-right font-semibold">{money(i.price * i.qty)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            {rates.length ? (<>
              <div className="flex justify-between text-[#5b6475]"><span>Taxable value</span><span>{money(tx.taxable)}</span></div>
              {rates.map((g) => tx.igst ? (
                <div key={g.rate} className="flex justify-between text-[#5b6475]"><span>IGST @ {g.rate}%</span><span>{money(g.gst)}</span></div>
              ) : (
                <div key={g.rate} className="space-y-1.5">
                  <div className="flex justify-between text-[#5b6475]"><span>CGST @ {g.rate / 2}%</span><span>{money(g.gst / 2)}</span></div>
                  <div className="flex justify-between text-[#5b6475]"><span>SGST @ {g.rate / 2}%</span><span>{money(g.gst / 2)}</span></div>
                </div>
              ))}
            </>) : <div className="flex justify-between text-[#5b6475]"><span>Items</span><span>{money(q ? q.items : subtotal)}</span></div>}
            {tx.shipping > 0 && <div className="flex justify-between text-[#5b6475]"><span>Shipping</span><span>{money(tx.shipping)}</span></div>}
            <div className="mt-2 flex justify-between rounded-xl bg-[#0a0f1f] px-4 py-3 text-base font-bold text-white"><span>{paid ? "Total paid" : "Total"}</span><span>{money(tx.total)}</span></div>
          </div>
        </div>
        <footer className="mt-10 border-t border-[#e6e9f0] pt-5 text-xs leading-relaxed text-[#5b6475]">
          <p>Sold by {s.tax.legalName || s.name}. This is a computer-generated invoice and does not require a signature.</p>
          <p className="mt-1">Store powered by Vishnu IT Solutions · vishnuit.co.in</p>
        </footer>
      </article>
    </main>
  );
}
