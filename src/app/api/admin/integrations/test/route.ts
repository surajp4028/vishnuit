import { requireAdminApi } from "@/lib/server/auth";
import { appendLead } from "@/lib/server/gsheet";

export async function POST(req: Request) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const { target } = await req.json().catch(() => ({}));
  if (target !== "lp" && target !== "site") return Response.json({ error: "Bad target" }, { status: 400 });
  const r = await appendLead(target, { id: 0, name: "✅ Test row from admin", phone: "+910000000000", email: "test@example.com", service: "Test", message: "Connection test — you can delete this row.", page: "/admin/settings" });
  return Response.json(r, { status: r.ok ? 200 : 400 });
}
