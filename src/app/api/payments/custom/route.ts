import { headers } from "next/headers";
import { exec } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { createOrder, rzpConfigured } from "@/lib/server/razorpay";
import { getSettings } from "@/lib/server/content";

const clean = (v: unknown, max = 190) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const MIN = 1, MAX = 500000;

/** "Pay Now" from the header: the customer enters the amount themselves (e.g. an advance or balance payment). */
export async function POST(req: Request) {
  const conv = (await getSettings()).conversion;
  if (!conv.payNowOnDesktop && !conv.payNowOnMobile) return Response.json({ error: "Online payments are turned off." }, { status: 403 });
  if (!rzpConfigured()) return Response.json({ error: "Online payments are not configured yet." }, { status: 503 });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`paynow:${ip}`, 10)) return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const name = clean(b.name, 120);
  const email = clean(b.email).toLowerCase();
  const phone = clean(b.phone, 40);
  const company = clean(b.company);
  const purpose = clean(b.purpose, 60) || "Payment";
  const amount = Math.round(Number(b.amount));
  if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return Response.json({ error: "Please enter a valid email." }, { status: 422 });
  if (!/^[+\d][\d\s-]{6,}$/.test(phone)) return Response.json({ error: "Please enter a valid phone number." }, { status: 422 });
  if (!Number.isFinite(amount) || amount < MIN || amount > MAX) return Response.json({ error: `Enter an amount between ₹${MIN} and ₹${MAX.toLocaleString("en-IN")}.` }, { status: 422 });

  try {
    const order = await createOrder(amount * 100, `vit_pay_${Date.now()}`, { purpose, name, email, phone });
    await exec(
      "INSERT INTO payments (plan_id, plan_name, amount, name, email, phone, company, notes, rzp_order_id) VALUES (NULL,?,?,?,?,?,?,?,?)",
      [purpose, amount, name, email, phone, company, "Pay Now (header)", order.id],
    );
    return Response.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    console.error("[paynow] order failed:", (e as Error).message);
    return Response.json({ error: "Could not start payment. Please try again or contact us." }, { status: 502 });
  }
}
