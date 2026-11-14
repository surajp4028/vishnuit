import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { refreshSite } from "@/lib/server/admin-crud";

const KEYS = ["branding", "hero", "stats", "contact", "social", "seo", "founder", "conversion", "integrations"];

export async function PUT(req: Request) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const { key, value } = await req.json().catch(() => ({}));
  if (!KEYS.includes(key) || value == null || typeof value !== "object") return Response.json({ error: "Invalid setting" }, { status: 400 });
  await exec("REPLACE INTO settings (k, v) VALUES (?, ?)", [key, JSON.stringify(value)]);
  refreshSite();
  return Response.json({ ok: true });
}
