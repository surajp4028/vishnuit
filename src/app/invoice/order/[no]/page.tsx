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

  const method = o.pay_method === "cod" ? "Cash on delivery" : o.pay_method === "razorpay" ? "Online (Razorpay)" : "UPI";
  const stamp = paid ? "PAID" : o.pay_method === "cod" ? "CASH ON DELIVERY" : "PAYMENT PENDING";
  const ink = "text-[#0a0f1f]", mute = "text-[#5b6475]";

  // Same look as the Vishnu IT invoices: thin brand line, big INVOICE, boxed stamp, BILLED TO / PAYMENT, green total when paid.
  return (
    <main className="min-h-dvh bg-[#f3f5f9] px-3 py-6 text-[#0a0f1f] sm:px-4 sm:py-8 print:bg-white print:p-0">
      <style>{`@page{size:A4;margin:12mm} @media print{.no-print{display:none!important} *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3"><p className={`text-sm ${mute}`}>Invoice {s.tax.invoicePrefix}-{orderNo}</p><PrintButton /></div>
      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(10,15,31,.35)] print:max-w-none print:rounded-none print:shadow-none">
        {/* thin brand line: blue → purple → green (same on every invoice, web and PDF) */}
        <div className="h-1 bg-[linear-gradient(90deg,#3b82f6_0%,#8b5cf6_50%,#10b981_100%)]" />
        <div className="p-6 sm:p-11">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#e6e9f0] pb-6">
            <div className="min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? <img src={logo} alt={s.name} className="h-12 w-auto max-w-[180px] object-contain" /> : <p className="font-display text-2xl font-extrabold">{s.name}</p>}
              <p className="mt-3 text-[15px] font-bold">{s.tax.legalName || s.name}</p>
              {s.contact.address && <p className={`mt-0.5 max-w-xs text-[13px] leading-relaxed whitespace-pre-line ${mute}`}>{s.contact.address}</p>}
              <p className={`text-[13px] ${mute}`}>{[s.contact.phone, s.contact.email].filter(Boolean).join("  |  ")}</p>
              {s.tax.gstin && <p className={`mt-1 text-[13px] font-bold ${mute}`}>GSTIN: {s.tax.gstin}</p>}
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{rates.length ? "TAX INVOICE" : "INVOICE"}</p>
              <p className="mt-2 text-sm">No. <b>{s.tax.invoicePrefix}-{orderNo}</b></p>
              <p className="text-sm">Date <b>{date}</b></p>
              <span className={`mt-3 inline-block rounded-full border-[1.5px] px-5 py-1 text-[11px] font-extrabold tracking-[3px] ${paid ? "border-[#057857] bg-[#057857]/[.06] text-[#057857]" : "border-[#d4a017] bg-[#d4a017]/[.06] text-[#a67c00]"}`}>{stamp}</span>
            </div>
          </header>

          <section className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className={`text-[11px] font-bold tracking-[2px] ${mute}`}>BILLED TO</p>
              {o.buyer_company ? <p className="mt-2 text-[15px] font-bold">{String(o.buyer_company)}</p> : null}
              <p className={o.buyer_company ? "text-sm font-medium" : "mt-2 text-[15px] font-bold"}>{String(o.name)}</p>
              {o.buyer_gstin ? <p className="mt-0.5 text-[13px] font-bold">GSTIN: {String(o.buyer_gstin)}</p> : null}
              <p className={`mt-0.5 text-[13px] leading-relaxed whitespace-pre-line ${mute}`}>{String(o.address ?? "")}</p>
              <p className={`text-[13px] ${mute}`}>{[String(o.phone ?? ""), o.email ? String(o.email) : ""].filter(Boolean).join("  |  ")}</p>
            </div>
            <div className="sm:text-right">
              <p className={`text-[11px] font-bold tracking-[2px] ${mute}`}>PAYMENT</p>
              <p className="mt-2 text-sm">Method: <b className="uppercase">{method}</b></p>
              {o.utr ? <p className="text-sm">Ref: <span className="font-mono">{String(o.utr)}</span></p> : null}
              <p className={`text-[13px] ${mute}`}>Order ID: <span className="font-mono">{orderNo}</span></p>
              {o.state ? <p className={`mt-2 text-[13px] ${mute}`}>Place of supply: <b className={ink}>{stateName(String(o.state))} ({String(o.state)})</b></p> : null}
            </div>
          </section>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className={`bg-[#f5f7fb] text-left text-[11px] font-bold tracking-[1.5px] ${mute}`}>
                  <th className="px-3 py-3">DESCRIPTION</th>{showHsn && <th className="px-3 py-3">HSN</th>}{showRate && <th className="px-3 py-3 text-center">GST</th>}<th className="px-3 py-3 text-center">QTY</th><th className="px-3 py-3 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>{items.map((i, k) => (
                <tr key={k} className="border-b border-[#e6e9f0] align-top">
                  <td className="px-3 py-3.5"><p className="font-bold">{i.name}</p><p className={`text-[12px] ${mute}`}>{i.variant ? `${i.variant}  |  ` : ""}{money(i.price)} × {i.qty}</p></td>
                  {showHsn && <td className="px-3 py-3.5">{i.hsn || s.tax.hsn || "—"}</td>}
                  {showRate && <td className="px-3 py-3.5 text-center">{i.gst_rate ?? s.tax.rate}%</td>}
                  <td className="px-3 py-3.5 text-center">{i.qty}</td>
                  <td className="px-3 py-3.5 text-right font-bold">{money(i.price * i.qty)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <div className={`w-full max-w-[300px] space-y-1.5 text-sm ${mute}`}>
              <div className="flex justify-between"><span>Subtotal</span><span>{money(q ? q.items : subtotal)}</span></div>
              {rates.length > 0 && <div className="flex justify-between"><span>Taxable value</span><span>{money(tx.taxable)}</span></div>}
              {rates.map((g) => tx.igst ? (
                <div key={g.rate} className="flex justify-between"><span>IGST @ {g.rate}%</span><span>{money(g.gst)}</span></div>
              ) : (
                <div key={g.rate} className="space-y-1.5">
                  <div className="flex justify-between"><span>CGST @ {g.rate / 2}%</span><span>{money(g.gst / 2)}</span></div>
                  <div className="flex justify-between"><span>SGST @ {g.rate / 2}%</span><span>{money(g.gst / 2)}</span></div>
                </div>
              ))}
              {tx.shipping > 0 && <div className="flex justify-between"><span>Shipping</span><span>{money(tx.shipping)}</span></div>}
              <div className="mt-2 flex justify-between rounded-xl bg-[#0a0f1f] px-4 py-3 text-base font-bold text-white"><span>{paid ? "Amount paid" : "Total due"}</span><span>{money(tx.total)}</span></div>
            </div>
          </div>

          <footer className={`mt-12 border-t border-[#e6e9f0] pt-5 text-[12px] leading-relaxed ${mute}`}>
            <p>Thank you for shopping with {s.name}! This is a computer-generated invoice and does not require a signature.</p>
            <p className="mt-0.5">Sold by {s.tax.legalName || s.name}{s.contact.email ? `. Questions? ${s.contact.email}` : ""}{s.contact.phone ? `  |  ${s.contact.phone}` : ""}  ·  Store powered by Vishnu IT Solutions</p>
          </footer>
        </div>
      </article>
    </main>
  );
}
