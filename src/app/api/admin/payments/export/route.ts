import { query } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const cols = ["id", "created_at", "paid_at", "status", "plan_name", "amount", "name", "email", "phone", "company", "method", "rzp_order_id", "rzp_payment_id", "project_status", "notes"];
  const rows = await query(`SELECT ${cols.join(",")} FROM payments ORDER BY id DESC`);
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="vishnuit-payments-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
