import { nextInvoiceNo } from "@/lib/server/invoice";
import { after } from "next/server";
import { exec, queryOne } from "@/lib/server/db";
import { sendMail } from "@/lib/server/mail";
import { siteUrl } from "@/lib/site";
import { restock } from "@/lib/server/stock";
import { requireStoreApi, str } from "@/lib/server/store-auth";
import { ORDER_LABEL, ORDER_STATUSES, PAY_STATUSES, type StatusLog } from "@/lib/order-status";

type Row = { id: number; status: string; items: unknown; status_log: unknown };
const parse = <T,>(v: unknown, d: T): T => { if (v == null) return d; if (typeof v === "string") { try { return JSON.parse(v) as T; } catch { return d; } } return v as T; };

/** Merchant updates an order: status (with history), payment status, tracking and a private note. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const o = await queryOne<Row>("SELECT id, status, items, status_log FROM store_orders WHERE id=? AND store_id=?", [id, a.store.id]);
  if (!o) return Response.json({ error: "Order not found." }, { status: 404 });

  if (typeof b.status === "string" && (ORDER_STATUSES as readonly string[]).includes(b.status) && b.status !== o.status) {
    const closed = (s: string) => s === "cancelled" || s === "returned";
    if (closed(b.status) !== closed(o.status)) await restock(parse(o.items, []), a.store.id, closed(b.status) ? 1 : -1);
    const log = parse<StatusLog>(o.status_log, []);
    log.push({ s: b.status, at: new Date().toISOString() });
    await exec("UPDATE store_orders SET status=?, status_log=? WHERE id=?", [b.status, JSON.stringify(log.slice(-30)), id]);
    // Cancelled/returned after an invoice was issued → a credit note in its own consecutive series (Sec 34 CGST Act).
    if (closed(b.status)) {
      const cn = await queryOne<{ invoice_no: string | null; credit_note_no: string | null }>("SELECT invoice_no, credit_note_no FROM store_orders WHERE id=?", [id]);
      if (cn?.invoice_no && !cn.credit_note_no) await exec("UPDATE store_orders SET credit_note_no=?, credit_note_at=NOW() WHERE id=? AND credit_note_no IS NULL", [await nextInvoiceNo(`cn:store:${a.store.id}`, "CN"), id]);
    }
    // Tell the shopper about the steps that matter to them.
    const st = b.status;
    if (["confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"].includes(st)) {
      after(async () => {
        const row = await queryOne<{ email: string | null; name: string; order_no: string; tracking: unknown }>("SELECT email, name, order_no, tracking FROM store_orders WHERE id=?", [id]);
        if (!row?.email) return;
        const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
        const t = (typeof row.tracking === "string" ? JSON.parse(row.tracking) : row.tracking) as { courier?: string; number?: string; url?: string } | null;
        const link = `${siteUrl()}/catalog/@${a.store.handle}/account`;
        const line = st === "cancelled" ? "Your order has been cancelled. If you paid online, the store will process your refund." : st === "delivered" ? "Your order has been delivered. We hope you love it!" : `Your order is now <b>${ORDER_LABEL[st]}</b>.`;
        await sendMail({
          to: row.email,
          subject: `${ORDER_LABEL[st]}: order ${row.order_no} — ${a.store.name}`,
          text: `Hi ${row.name}, order ${row.order_no} is now ${ORDER_LABEL[st]}. Track: ${link}`,
          html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:#0a0f1f;color:#fff;padding:20px 24px"><div style="font-size:12px;letter-spacing:2px;color:#f5c542">${esc(a.store.name)}</div><div style="font-size:20px;font-weight:700;margin-top:4px">Order ${esc(row.order_no)} · ${ORDER_LABEL[st]}</div></div><div style="padding:20px 24px;font-size:14px;color:#222"><p>Hi ${esc(row.name)},</p><p>${line}</p>${t?.number ? `<p>Courier: <b>${esc(t.courier || "—")}</b> · AWB <b>${esc(t.number)}</b>${t.url ? ` · <a href="${esc(t.url)}">Track package</a>` : ""}</p>` : ""}<p><a href="${link}" style="background:#0a0f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px">View my order</a></p></div></div>`,
        }).catch(() => {});
      });
    }
  }
  if (typeof b.pay_status === "string" && (PAY_STATUSES as readonly string[]).includes(b.pay_status)) await exec("UPDATE store_orders SET pay_status=? WHERE id=?", [b.pay_status, id]);
  if (b.tracking && typeof b.tracking === "object") {
    const t = b.tracking as Record<string, unknown>;
    const url = str(t.url, 300);
    if (url && !/^https?:\/\/\S+$/.test(url)) return Response.json({ error: "Tracking link must start with https://" }, { status: 422 });
    await exec("UPDATE store_orders SET tracking=? WHERE id=?", [JSON.stringify({ courier: str(t.courier, 60), number: str(t.number, 60), url }), id]);
  }
  if (typeof b.note === "string") await exec("UPDATE store_orders SET note=? WHERE id=?", [b.note.slice(0, 2000), id]);
  return Response.json({ ok: true, order: await queryOne("SELECT * FROM store_orders WHERE id=?", [id]) });
}
