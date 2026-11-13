import "server-only";
import { exec, queryOne } from "./db";
import { sendMail } from "./mail";
import { getSettings } from "./content";
import { formatINR } from "@/lib/utils";

type Payment = { id: number; plan_name: string; amount: number; name: string; email: string; phone: string; company: string; rzp_order_id: string; status: string };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Idempotently mark an order paid and send notifications once. */
export async function markPaid(orderId: string, paymentId: string, method: string | null, signature: string | null) {
  const r = await exec(
    "UPDATE payments SET status='paid', rzp_payment_id=?, rzp_signature=COALESCE(?, rzp_signature), method=?, paid_at=NOW() WHERE rzp_order_id=? AND status<>'paid'",
    [paymentId, signature, method, orderId],
  );
  if (r.affectedRows === 0) return; // already processed
  const p = await queryOne<Payment>("SELECT * FROM payments WHERE rzp_order_id=?", [orderId]);
  if (!p) return;
  const s = await getSettings();
  const amount = formatINR(p.amount);
  const admin = process.env.CONTACT_TO_EMAIL || s.contact.email;
  const row = (k: string, v: string) => `<tr><td style="padding:8px 0;color:#667;font-size:13px;width:120px">${k}</td><td style="padding:8px 0;font-size:14px">${esc(v)}</td></tr>`;
  const card = (title: string, body: string) =>
    `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#0a0f1f,#1d4ed8);color:#fff;padding:24px 28px"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f5c542">${s.branding.siteName}</div><div style="font-size:22px;font-weight:700;margin-top:6px">${title}</div></div><div style="padding:20px 28px">${body}</div></div>`;
  const details = `<table style="width:100%;border-collapse:collapse">${row("Plan", p.plan_name)}${row("Amount", amount)}${row("Payment ID", paymentId)}${row("Order ID", orderId)}${row("Name", p.name)}${row("Email", p.email)}${row("Phone", p.phone || "—")}${row("Company", p.company || "—")}</table>`;
  await Promise.all([
    sendMail({ to: admin, subject: `💰 New ${p.plan_name} plan purchase — ${amount} from ${p.name}`, html: card(`${p.name} bought the ${p.plan_name} plan`, details), text: `${p.name} paid ${amount} for ${p.plan_name}. Payment ${paymentId}`, replyTo: p.email }),
    sendMail({ to: p.email, subject: `Payment received — ${p.plan_name} plan · ${s.branding.siteName}`, html: card(`Thank you, ${esc(p.name)}! 🎉`, `<p style="font-size:14px;color:#333">We've received your payment for the <b>${esc(p.plan_name)}</b> plan. Our team will contact you within 24 hours to kick off your project.</p>${details}<p style="font-size:13px;color:#667">Questions? Call ${esc(s.contact.phone)} or reply to this email.</p>`), text: `Payment of ${amount} received for ${p.plan_name}. Payment ID ${paymentId}.`, replyTo: admin }),
  ]).catch(() => {});
}
