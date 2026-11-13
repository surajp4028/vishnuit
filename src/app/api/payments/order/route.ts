import { headers } from "next/headers";
import { exec, queryOne } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { createOrder, rzpConfigured } from "@/lib/server/razorpay";

const clean = (v: unknown, max = 190) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (!rzpConfigured()) return Response.json({ error: "Online payments are not configured yet." }, { status: 503 });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`order:${ip}`, 10)) return Response.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const name = clean(body.name, 120);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone, 40);
  const company = clean(body.company);
  const notes = clean(body.notes, 2000);
  if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return Response.json({ error: "Please enter a valid email." }, { status: 422 });
  if (!/^[+\d][\d\s-]{6,}$/.test(phone)) return Response.json({ error: "Please enter a valid phone number." }, { status: 422 });

  // Price always comes from the database — never from the browser.
  const plan = await queryOne<{ id: number; name: string; price: number }>("SELECT id, name, price FROM plans WHERE id=? AND published=1", [Number(body.planId)]);
  if (!plan || plan.price <= 0) return Response.json({ error: "Plan not found." }, { status: 404 });

  try {
    const order = await createOrder(plan.price * 100, `vit_${Date.now()}`, { plan: plan.name, name, email, phone });
    await exec(
      "INSERT INTO payments (plan_id, plan_name, amount, name, email, phone, company, notes, rzp_order_id) VALUES (?,?,?,?,?,?,?,?,?)",
      [plan.id, plan.name, plan.price, name, email, phone, company, notes, order.id],
    );
    return Response.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, plan: plan.name });
  } catch (e) {
    console.error("[payments] order failed:", (e as Error).message);
    return Response.json({ error: "Could not start payment. Please try again or contact us." }, { status: 502 });
  }
}
