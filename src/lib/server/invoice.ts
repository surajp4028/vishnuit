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

/** e.g. VIT/2026-27/0012 (Indian financial year). */
export function invoiceNumber(id: number, date: Date) {
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `VIT/${y}-${String(y + 1).slice(2)}/${String(id).padStart(4, "0")}`;
}
