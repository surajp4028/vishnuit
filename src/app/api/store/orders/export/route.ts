import { requireStoreApi } from "@/lib/server/store-auth";
import { storeOrders } from "@/lib/server/seller";
import { stateName } from "@/lib/gst-states";
import type { OrderQuote } from "@/lib/server/catalog";

// Quote every cell; a leading = + - @ (or tab/CR) is neutralised so a shopper's name can't run as a spreadsheet formula.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  // Plain numbers like +919876543210 or -50 are safe and stay as they are.
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s.]+$/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Merchant downloads orders as CSV — one row per GST rate, with the columns a CA needs for GSTR-1
 * (invoice no., buyer GSTIN, place of supply, taxable value, CGST/SGST/IGST, credit notes).
 */
export async function GET() {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const rows = await storeOrders(a.store.id, 5000);
  const head = ["Invoice no", "Invoice date", "Order", "Order status", "Credit note", "Customer", "Buyer GSTIN", "Business name", "Place of supply", "Phone", "Email", "Items", "GST rate %", "Taxable value", "CGST", "SGST", "IGST", "Delivery (in taxable)", "Invoice total", "Payment", "Payment ref", "Payment status"];
  const out: string[] = [head.map(cell).join(",")];
  for (const o of rows) {
    const x = o as typeof o & { invoice_no?: string | null; credit_note_no?: string | null; state?: string | null; buyer_gstin?: string | null; buyer_company?: string | null; tax?: unknown };
    const q = (typeof x.tax === "string" ? JSON.parse(x.tax) : x.tax) as OrderQuote | null;
    const date = new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" });
    const pos = x.state ? `${x.state}-${stateName(x.state)}` : "";
    const items = o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.qty}`).join("; ");
    const base = [x.invoice_no ?? "", date, o.order_no, o.status, x.credit_note_no ?? "", o.name, x.buyer_gstin ?? "", x.buyer_company ?? "", pos, o.phone, o.email ?? "", items];
    const tail = [o.subtotal, o.pay_method, o.utr ?? "", o.pay_status];
    const rates = q?.rates?.length ? q.rates : [{ rate: 0, taxable: o.subtotal, gst: 0 }];
    for (const g of rates) {
      const cg = !q?.igst && g.rate ? (g as { cgst?: number }).cgst ?? r2(g.gst / 2) : 0;
      const sg = !q?.igst && g.rate ? (g as { sgst?: number }).sgst ?? r2(g.gst - cg) : 0;
      const ig = q?.igst && g.rate ? g.gst : 0;
      out.push([...base, g.rate, g.taxable, cg, sg, ig, (g as { ship?: number }).ship ?? "", ...tail].map(cell).join(","));
    }
  }
  return new Response(out.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${a.store.handle}-orders-gst.csv"` },
  });
}
