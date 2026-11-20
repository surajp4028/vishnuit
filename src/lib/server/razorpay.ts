import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.razorpay.com/v1";

export function rzpConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

type Creds = { keyId: string; secret: string };
function auth(c?: Creds) {
  return "Basic " + Buffer.from(`${c?.keyId ?? process.env.RAZORPAY_KEY_ID}:${c?.secret ?? process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
}

/** Creates a Razorpay order — on Vishnu IT's account, or on a merchant's own account when `creds` is given. */
export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>, creds?: Creds) {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { Authorization: auth(creds), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes, payment_capture: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.description || "Razorpay order failed");
  return json as { id: string; amount: number; currency: string };
}

export async function fetchPayment(paymentId: string) {
  const res = await fetch(`${BASE}/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: auth() }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  return (await res.json()) as { id: string; order_id: string; status: string; method: string; amount: number };
}

function safeEq(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret?: string) {
  const expected = createHmac("sha256", secret ?? process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEq(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEq(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}
