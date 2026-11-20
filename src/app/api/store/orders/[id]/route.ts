import { exec, queryOne } from "@/lib/server/db";
import { hydrateProduct } from "@/lib/server/catalog";
import { requireStoreApi, str } from "@/lib/server/store-auth";
import { ORDER_STATUSES, PAY_STATUSES, type StatusLog } from "@/lib/order-status";

type Row = { id: number; status: string; items: unknown; status_log: unknown };
const parse = <T,>(v: unknown, d: T): T => { if (v == null) return d; if (typeof v === "string") { try { return JSON.parse(v) as T; } catch { return d; } } return v as T; };

/** Put stock back when an order is cancelled or returned (and take it again if it's re-opened). */
async function restock(items: { id: number; variant: string | null; qty: number }[], storeId: number, sign: 1 | -1) {
  for (const i of items) {
    const r = await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE id=? AND store_id=?", [i.id, storeId]);
    if (!r) continue;
    if (i.variant) {
      const p = hydrateProduct(r);
      const variants = p.variants.map((v) => (v.key === i.variant && v.stock != null ? { ...v, stock: Math.max(0, v.stock + sign * i.qty) } : v));
      await exec("UPDATE store_products SET variants=? WHERE id=?", [JSON.stringify(variants), i.id]);
    } else {
      await exec("UPDATE store_products SET stock=GREATEST(0, stock+?) WHERE id=? AND stock IS NOT NULL", [sign * i.qty, i.id]);
    }
  }
}

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
