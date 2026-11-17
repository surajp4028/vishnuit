import { revalidatePath } from "next/cache";
import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { getLpPixels } from "@/lib/server/lp-pixels";
import { getLandingPage } from "@/data/landing-pages";

/** Save (or clear) a landing page's own Meta Pixel. Empty pixelId = use the common pixel. */
export async function PUT(req: Request) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as { slug?: string; pixelId?: string; capiToken?: string; clearToken?: boolean };
  const slug = String(b.slug ?? "");
  if (!getLandingPage(slug)) return Response.json({ error: "Unknown landing page" }, { status: 404 });
  const pixelId = String(b.pixelId ?? "").replace(/\s/g, "");
  if (pixelId && !/^\d{10,20}$/.test(pixelId)) return Response.json({ error: "Pixel ID should be only numbers (15–16 digits), not the full script." }, { status: 422 });

  const map = { ...(await getLpPixels()) };
  const prev = map[slug];
  const token = b.clearToken ? "" : String(b.capiToken ?? "").trim() || prev?.capiToken || "";
  if (pixelId) map[slug] = { pixelId, capiToken: token };
  else delete map[slug];
  await exec("REPLACE INTO settings (k, v) VALUES ('lpPixels', ?)", [JSON.stringify(map)]);
  revalidatePath(`/${slug}`);
  revalidatePath("/thank-you");
  return Response.json({ ok: true, pixelId: map[slug]?.pixelId ?? "", hasToken: Boolean(map[slug]?.capiToken) });
}
