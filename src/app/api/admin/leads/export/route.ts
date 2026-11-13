import { query } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";

export async function GET() {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const rows = await query("SELECT id,created_at,name,email,phone,service,budget,status,source,page,message,notes FROM leads ORDER BY id DESC");
  const cols = ["id", "created_at", "name", "email", "phone", "service", "budget", "status", "source", "page", "message", "notes"];
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s; // CSV formula-injection guard
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="vishnuit-leads-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
