import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Unguessable token so only the payer (and admin) can open an invoice link. */
export function invoiceToken(orderId: string) {
  const s = process.env.AUTH_SECRET || "";
  return createHmac("sha256", s).update(`invoice:${orderId}`).digest("base64url").slice(0, 32);
}

export function invoiceTokenOk(orderId: string, token: string) {
  const a = Buffer.from(invoiceToken(orderId));
  const b = Buffer.from(token || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const invoicePath = (orderId: string) => `/invoice/${encodeURIComponent(orderId)}?t=${invoiceToken(orderId)}`;

/** Indian financial year in IST, e.g. "26-27" (1 Apr 2026 – 31 Mar 2027). */
export function fyOf(date: Date) {
  const ist = new Date(date.getTime() + 330 * 60_000);
  const y = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${String(y).slice(2)}-${String(y + 1).slice(2)}`;
}

type Runner = { query: (sql: string, values?: unknown[]) => Promise<unknown> };
/**
 * Next number in a consecutive series (GST Rule 46(b): consecutive, unique per FY, ≤16 chars).
 * Atomic: two orders at the same moment can't get the same number.
 * scope "vit" → VIT/26-27/0001 · scope "store:12" with prefix "INV" → INV/26-27/0001.
 */
export async function nextInvoiceNo(scope: string, prefix: string, date = new Date(), conn?: Runner) {
  const fy = fyOf(date);
  const sql = "INSERT INTO invoice_seq (scope, fy, n) VALUES (?, ?, LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE n=LAST_INSERT_ID(n+1)";
  let n: number;
  if (conn) { const [r] = (await conn.query(sql, [scope, fy])) as [{ insertId: number }]; n = Number(r.insertId); }
  else { const { exec } = await import("./db"); n = Number((await exec(sql, [scope, fy])).insertId); }
  const p = (prefix.toUpperCase().replace(/[^A-Z0-9]/g, "") || "INV").slice(0, 4);
  return `${p}/${fy}/${String(n).padStart(4, "0")}`;
}

/** Old style number from the payment id (only for payments made before numbering by series). */
export function invoiceNumber(id: number, date: Date) {
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `VIT/${y}-${String(y + 1).slice(2)}/${String(id).padStart(4, "0")}`;
}

/** Link to a shop order's invoice (merchant and customer both use it). */
export const orderInvoicePath = (orderNo: string) => `/invoice/order/${encodeURIComponent(orderNo)}?t=${invoiceToken(`order:${orderNo}`)}`;
export const orderInvoiceTokenOk = (orderNo: string, token: string) => invoiceTokenOk(`order:${orderNo}`, token);
