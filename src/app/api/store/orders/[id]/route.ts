import { exec, queryOne } from "@/lib/server/db";
import { requireStoreApi } from "@/lib/server/store-auth";

const STATUS = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const PAY = ["pending", "verified", "paid", "failed"];

/** Merchant updates an order: status, and payment verification (e.g. after checking the UTR in their bank app). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireStoreApi();
  if (a instanceof Response) return a;
  const id = Number((await params).id);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const o = await queryOne<{ id: number }>("SELECT id FROM store_orders WHERE id=? AND store_id=?", [id, a.store.id]);
  if (!o) return Response.json({ error: "Order not found." }, { status: 404 });
  if (typeof b.status === "string" && STATUS.includes(b.status)) await exec("UPDATE store_orders SET status=? WHERE id=?", [b.status, id]);
  if (typeof b.pay_status === "string" && PAY.includes(b.pay_status)) await exec("UPDATE store_orders SET pay_status=? WHERE id=?", [b.pay_status, id]);
  if (typeof b.note === "string") await exec("UPDATE store_orders SET note=? WHERE id=?", [b.note.slice(0, 2000), id]);
  return Response.json({ ok: true, order: await queryOne("SELECT * FROM store_orders WHERE id=?", [id]) });
}
