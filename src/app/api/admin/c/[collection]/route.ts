import { query, exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { getCollection, toRow, fromRow, refreshSite } from "@/lib/server/admin-crud";

type Ctx = { params: Promise<{ collection: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const c = getCollection((await params).collection);
  if (!c) return Response.json({ error: "Unknown collection" }, { status: 404 });
  const rows = await query(`SELECT * FROM ${c.table} ORDER BY ${c.orderBy}`);
  return Response.json({ items: rows.map((r) => fromRow(c, r)) });
}

export async function POST(req: Request, { params }: Ctx) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const c = getCollection((await params).collection);
  if (!c) return Response.json({ error: "Unknown collection" }, { status: 404 });
  try {
    const row = toRow(c, await req.json());
    const cols = Object.keys(row);
    const r = await exec(`INSERT INTO ${c.table} (${cols.map((k) => `\`${k}\``).join(",")}) VALUES (${cols.map(() => "?").join(",")})`, Object.values(row));
    refreshSite();
    return Response.json({ ok: true, id: r.insertId });
  } catch (e) {
    const msg = (e as Error).message;
    return Response.json({ error: msg.includes("Duplicate") ? "That slug is already used." : msg }, { status: 400 });
  }
}
