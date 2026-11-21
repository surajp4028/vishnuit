import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type InvoiceData = {
  number: string; date: string; paid: boolean;
  seller: { name: string; address: string; phone: string; email: string; web: string };
  buyer: { name: string; company?: string | null; email?: string | null; phone?: string | null };
  item: string; amount: number;
  sellerGstin?: string | null;
  /** GST breakdown (catalog plans). Without it the amount is shown as a single total. */
  tax?: { qty: number; unit: number; base: number; discount: number; coupon: string | null; taxable: number; rate: number; gst: number } | null;
  payment: { method?: string | null; paymentId?: string | null; orderId: string };
};

const inr = (n: number) => "INR " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const C = { ink: rgb(0.04, 0.06, 0.12), mute: rgb(0.36, 0.39, 0.46), line: rgb(0.9, 0.91, 0.94), soft: rgb(0.96, 0.97, 0.98), green: rgb(0.02, 0.47, 0.34), blue: rgb(0.11, 0.31, 0.85), gold: rgb(0.83, 0.63, 0.09) };

/** A4 invoice PDF (pdf-lib, works on Vercel without a browser). */
export async function renderInvoicePdf(d: InvoiceData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${d.number}`);
  pdf.setAuthor(d.seller.name);
  const page = pdf.addPage([595.28, 841.89]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, L = 46, R = W - 46;
  const text = (t: string, x: number, y: number, o: { size?: number; font?: typeof reg; color?: typeof C.ink; right?: boolean } = {}) => {
    const size = o.size ?? 10, font = o.font ?? reg;
    const clean = t.replace(/[^\x20-\x7E]/g, ""); // standard fonts are Latin-only
    page.drawText(clean, { x: o.right ? x - font.widthOfTextAtSize(clean, size) : x, y, size, font, color: o.color ?? C.ink });
  };

  // Thin brand line across the top: blue → purple → green (pdf-lib has no gradients, so it's drawn in thin slices).
  {
    // Same line as the web invoices: #3b82f6 → #8b5cf6 (50%) → #10b981.
    const stops: [number, [number, number, number]][] = [[0, [0.231, 0.51, 0.965]], [0.5, [0.545, 0.361, 0.965]], [1, [0.063, 0.725, 0.506]]];
    const N = 160, sw = W / N;
    for (let i = 0; i < N; i++) {
      const p = i / (N - 1);
      const k = stops.findIndex(([at]) => at >= p);
      const [a0, c0] = stops[Math.max(0, k - 1)], [a1, c1] = stops[Math.max(0, k)];
      const f = a1 === a0 ? 0 : (p - a0) / (a1 - a0);
      page.drawRectangle({ x: i * sw, y: 837.8, width: sw + 0.4, height: 4.1, color: rgb(c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f) });
    }
  }

  try {
    const logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public/brand/vishnuit-vishnu-logo-white.png")));
    const h = 44, w = (logo.width / logo.height) * h;
    page.drawImage(logo, { x: L, y: 768, width: w, height: h });
  } catch {}
  text(d.seller.name, L, 748, { font: bold, size: 11 });
  text(d.seller.address, L, 734, { color: C.mute, size: 9 });
  text(`${d.seller.phone}  |  ${d.seller.email}`, L, 721, { color: C.mute, size: 9 });
  text(d.seller.web, L, 708, { color: C.mute, size: 9 });
  if (d.sellerGstin) text(`GSTIN: ${d.sellerGstin}`, L, 695, { color: C.mute, size: 9, font: bold });

  text("INVOICE", R, 786, { font: bold, size: 24, right: true });
  text(`No. ${d.number}`, R, 766, { right: true, size: 10 });
  text(`Date ${d.date}`, R, 752, { right: true, size: 10 });
  const stamp = d.paid ? "PAID" : "PENDING";
  const sw = bold.widthOfTextAtSize(stamp, 9) + 26;
  page.drawRectangle({ x: R - sw, y: 722, width: sw, height: 20, borderColor: d.paid ? C.green : C.gold, borderWidth: 1.4, color: rgb(1, 1, 1), opacity: 1 });
  text(stamp, R - 13, 728.5, { font: bold, size: 9, color: d.paid ? C.green : C.gold, right: true });

  page.drawLine({ start: { x: L, y: 690 }, end: { x: R, y: 690 }, thickness: 0.8, color: C.line });

  text("BILLED TO", L, 666, { font: bold, size: 8, color: C.mute });
  let y = 650;
  for (const [t, b] of [[d.buyer.name, true], [d.buyer.company, false], [d.buyer.email, false], [d.buyer.phone, false]] as const) {
    if (!t) continue;
    text(String(t), L, y, { font: b ? bold : reg, size: b ? 11 : 9.5, color: b ? C.ink : C.mute });
    y -= 14;
  }
  text("PAYMENT", R, 666, { font: bold, size: 8, color: C.mute, right: true });
  text(`Method: ${(d.payment.method ?? "Razorpay").toUpperCase()}`, R, 650, { right: true, size: 9.5 });
  if (d.payment.paymentId) text(`Payment ID: ${d.payment.paymentId}`, R, 636, { right: true, size: 9.5 });
  text(`Order ID: ${d.payment.orderId}`, R, 622, { right: true, size: 9, color: C.mute });

  // table
  page.drawRectangle({ x: L, y: 560, width: R - L, height: 26, color: C.soft });
  text("DESCRIPTION", L + 12, 569, { font: bold, size: 8, color: C.mute });
  text("QTY", 400, 569, { font: bold, size: 8, color: C.mute });
  text("AMOUNT", R - 12, 569, { font: bold, size: 8, color: C.mute, right: true });
  const t = d.tax;
  const money = (n: number) => "INR " + new Intl.NumberFormat("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
  text(d.item.slice(0, 70), L + 12, 536, { font: bold, size: 10.5 });
  if (t) text(`${money(t.unit)} x ${t.qty} year${t.qty > 1 ? "s" : ""}  |  SAC 998315`, L + 12, 522, { size: 8.5, color: C.mute });
  text(String(t?.qty ?? 1), 404, 536, { size: 10.5 });
  text(money(t ? t.base : d.amount), R - 12, 536, { font: bold, size: 10.5, right: true });
  page.drawLine({ start: { x: L, y: 508 }, end: { x: R, y: 508 }, thickness: 0.8, color: C.line });

  let ty = 486;
  const row = (label: string, val: string) => { text(label, R - 190, ty, { color: C.mute, size: 10 }); text(val, R, ty, { right: true, size: 10, color: C.mute }); ty -= 17; };
  if (t) {
    row("Subtotal", money(t.base));
    if (t.discount > 0) row(`Discount${t.coupon ? ` (${t.coupon})` : ""}`, `- ${money(t.discount)}`);
    row("Taxable value", money(t.taxable));
    row(`GST @ ${t.rate}%`, money(t.gst));
  } else {
    row("Subtotal", money(d.amount));
  }
  const boxY = ty - 26;
  page.drawRectangle({ x: R - 190, y: boxY, width: 190, height: 32, color: C.ink });
  text(d.paid ? "Amount paid" : "Total due", R - 176, boxY + 11, { font: bold, size: 11.5, color: rgb(1, 1, 1) });
  text(money(d.amount), R - 14, boxY + 11, { font: bold, size: 11.5, color: rgb(1, 1, 1), right: true });

  page.drawLine({ start: { x: L, y: 92 }, end: { x: R, y: 92 }, thickness: 0.8, color: C.line });
  text("Thank you for your business! This is a computer-generated invoice and does not require a signature.", L, 74, { size: 8.5, color: C.mute });
  text(`Payments are processed securely by Razorpay. Questions? ${d.seller.email} | ${d.seller.phone}`, L, 61, { size: 8.5, color: C.mute });

  return Buffer.from(await pdf.save());
}
