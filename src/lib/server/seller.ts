import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { query } from "./db";
import { requireUser } from "./users";
import { getCatalogConfig, getStoreForUser } from "./catalog";

/** For /seller pages: the signed-in merchant and their store (redirects otherwise). */
export const requireSeller = cache(async () => {
  const user = await requireUser("/seller");
  const [store, cfg] = await Promise.all([getStoreForUser(user.id), getCatalogConfig()]);
  if (!cfg.features.enabled) redirect("/account");
  if (!store) redirect("/account/store");
  return { user, store, cfg };
});

export type OrderRow = {
  id: number; order_no: string; name: string; phone: string; email: string | null; address: string | null;
  items: { id: number; name: string; variant: string | null; price: number; qty: number }[];
  subtotal: number; pay_method: string; utr: string | null; pay_status: string; status: string; note: string | null; created_at: string; invoice: string;
};
export async function storeOrders(storeId: number, limit = 500) {
  const { orderInvoicePath } = await import("./invoice");
  const rows = await query<Record<string, unknown>>("SELECT * FROM store_orders WHERE store_id=? ORDER BY id DESC LIMIT ?", [storeId, limit]);
  return rows.map((r) => ({
    ...(r as unknown as OrderRow),
    items: typeof r.items === "string" ? JSON.parse(r.items) : (r.items as OrderRow["items"]),
    subtotal: Number(r.subtotal), created_at: String(r.created_at), invoice: orderInvoicePath(String(r.order_no)),
  })) as OrderRow[];
}
