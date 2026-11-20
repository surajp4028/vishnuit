import { requireStoreApi } from "@/lib/server/store-auth";
import { storeOrders } from "@/lib/server/seller";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Merchant downloads all orders as CSV (opens in Excel / Google Sheets). */
export async function GET() {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const rows = await storeOrders(a.store.id, 5000);
  const head = ["Order", "Date", "Customer", "Phone", "Email", "Address", "Items", "Total", "Payment", "Payment ref", "Payment status", "Order status"];
  const lines = rows.map((o) => [o.order_no, new Date(o.created_at).toLocaleString("en-IN"), o.name, o.phone, o.email, o.address, o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.qty}`).join("; "), o.subtotal, o.pay_method, o.utr, o.pay_status, o.status].map(cell).join(","));
  return new Response([head.map(cell).join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${a.store.handle}-orders.csv"` },
  });
}
