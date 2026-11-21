import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/server/db";
import { getSettings } from "@/lib/server/content";
import { invoiceNumber, invoiceTokenOk } from "@/lib/server/invoice";
import { formatINR } from "@/lib/utils";
import { PrintButton } from "@/components/site/print-button";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type P = { id: number; plan_id: number | null; plan_name: string; amount: number; name: string; email: string; phone: string | null; company: string | null; rzp_order_id: string; rzp_payment_id: string | null; method: string | null; status: string; created_at: string; paid_at: string | null };

const d = (v: string | Date) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ order: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ order }, { t = "" }] = await Promise.all([params, searchParams]);
  const orderId = decodeURIComponent(order);
  if (!invoiceTokenOk(orderId, t)) notFound();
  const [p, s] = await Promise.all([queryOne<P>("SELECT * FROM payments WHERE rzp_order_id=?", [orderId]), getSettings()]);
  if (!p) notFound();
  const paid = p.status === "paid";
  const date = new Date(p.paid_at ?? p.created_at);
  const no = invoiceNumber(p.id, date);
  const item = p.plan_id ? `${p.plan_name} plan — website development` : p.plan_name;
  const c = s.contact;

  return (
    <main className="min-h-dvh bg-[#f3f5f9] px-4 py-8 text-[#0a0f1f] print:bg-white print:p-0">
      <style>{`@page{size:A4;margin:14mm} @media print{.no-print{display:none!important} *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style>
      <div className="no-print mx-auto mb-5 flex max-w-3xl items-center justify-between gap-3">
        <p className="text-sm text-[#5b6475]">Invoice {no}</p>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(10,15,31,.35)] print:max-w-none print:rounded-none print:shadow-none">
        <div className="h-1 bg-[linear-gradient(90deg,#3b82f6_0%,#8b5cf6_50%,#10b981_100%)]" />
        <div className="p-8 md:p-12 print:p-0 print:pt-6">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#e6e9f0] pb-8">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.branding.logoLight} alt={s.branding.siteName} className="h-14 w-auto" />
            <p className="mt-4 text-sm font-semibold">{s.branding.siteName}</p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-[#5b6475]">{c.address}<br />{c.phone} · {c.email}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-extrabold tracking-tight">INVOICE</p>
            <p className="mt-2 text-sm text-[#5b6475]">No. <b className="text-[#0a0f1f]">{no}</b></p>
            <p className="text-sm text-[#5b6475]">Date <b className="text-[#0a0f1f]">{d(date)}</b></p>
            <span className={`mt-3 inline-block rounded-full border-2 px-4 py-1 text-xs font-extrabold tracking-[3px] ${paid ? "border-emerald-600 text-emerald-600" : "border-amber-500 text-amber-600"}`}>{paid ? "PAID" : "PENDING"}</span>
          </div>
        </header>

        <section className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-[2px] text-[#5b6475]">BILLED TO</p>
            <p className="mt-2 font-semibold">{p.name}</p>
            {p.company && <p className="text-sm text-[#5b6475]">{p.company}</p>}
            <p className="text-sm text-[#5b6475]">{p.email}{p.phone ? <><br />{p.phone}</> : null}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold tracking-[2px] text-[#5b6475]">PAYMENT</p>
            <p className="mt-2 text-sm text-[#5b6475]">Method <b className="text-[#0a0f1f] capitalize">{p.method ?? "Razorpay"}</b></p>
            {p.rzp_payment_id && <p className="text-sm text-[#5b6475]">Payment ID <b className="font-mono text-[#0a0f1f]">{p.rzp_payment_id}</b></p>}
            <p className="text-sm text-[#5b6475]">Order ID <span className="font-mono">{p.rzp_order_id}</span></p>
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f7fb] text-left text-xs tracking-[1.5px] text-[#5b6475]">
              <th className="rounded-l-xl px-4 py-3 font-bold">DESCRIPTION</th>
              <th className="px-4 py-3 text-center font-bold">QTY</th>
              <th className="rounded-r-xl px-4 py-3 text-right font-bold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#e6e9f0]">
              <td className="px-4 py-4 font-medium">{item}</td>
              <td className="px-4 py-4 text-center">1</td>
              <td className="px-4 py-4 text-right font-semibold">{formatINR(Number(p.amount))}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-[#5b6475]"><span>Subtotal</span><span>{formatINR(Number(p.amount))}</span></div>
            <div className="flex justify-between rounded-xl bg-[#0a0f1f] px-4 py-3 text-base font-bold text-white"><span>{paid ? "Total paid" : "Total due"}</span><span>{formatINR(Number(p.amount))}</span></div>
          </div>
        </div>

        <footer className="mt-12 border-t border-[#e6e9f0] pt-6 text-xs leading-relaxed text-[#5b6475]">
          <p>Thank you for your business! This is a computer-generated invoice and does not require a signature.</p>
          <p className="mt-1">Payments are processed securely by Razorpay. For any questions, contact {c.email} or {c.phone}.</p>
        </footer>
        </div>
      </article>
    </main>
  );
}
