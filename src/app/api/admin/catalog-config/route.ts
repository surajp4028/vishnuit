import { revalidatePath } from "next/cache";
import { exec } from "@/lib/server/db";
import { requireAdminApi } from "@/lib/server/auth";
import { DEFAULT_FEATURES, DEFAULT_PLANS, PLAN_KEYS, type CatalogFeatures, type PlanDef, type PlanKey } from "@/lib/server/catalog";

/** Admin edits plan names, product limits, yearly prices, GST rate and seller GSTIN. */
export async function PUT(req: Request) {
  const a = await requireAdminApi();
  if (a instanceof Response) return a;
  const b = (await req.json().catch(() => ({}))) as { plans?: Record<string, Partial<PlanDef>>; gstRate?: unknown; sellerGstin?: unknown; sellerLegalName?: unknown; features?: Partial<CatalogFeatures> };
  const plans = {} as Record<PlanKey, PlanDef>;
  for (const k of PLAN_KEYS) {
    const p = b.plans?.[k] ?? {};
    const limit = p.limit === null || (p.limit as unknown) === "" ? null : Math.max(1, Math.floor(Number(p.limit ?? DEFAULT_PLANS[k].limit)));
    plans[k] = {
      name: String(p.name ?? DEFAULT_PLANS[k].name).trim().slice(0, 30) || DEFAULT_PLANS[k].name,
      limit: k === "free" && limit == null ? DEFAULT_PLANS.free.limit : limit,
      price: k === "free" ? 0 : Math.max(1, Math.round(Number(p.price ?? DEFAULT_PLANS[k].price))),
      razorpay: k === "free" ? false : p.razorpay !== false,
    };
  }
  const gstRate = Math.min(28, Math.max(0, Number(b.gstRate ?? 18)));
  const sellerGstin = String(b.sellerGstin ?? "").trim().toUpperCase();
  if (sellerGstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(sellerGstin)) return Response.json({ error: "GSTIN format looks wrong (15 characters, e.g. 07ABCDE1234F1Z5)." }, { status: 422 });
  const features = Object.fromEntries(Object.keys(DEFAULT_FEATURES).map((k) => [k, b.features?.[k as keyof CatalogFeatures] ?? DEFAULT_FEATURES[k as keyof CatalogFeatures]])) as CatalogFeatures;
  const v = { plans, gstRate, sellerGstin, sellerLegalName: String(b.sellerLegalName ?? "").trim().slice(0, 120), features };
  await exec("REPLACE INTO settings (k, v) VALUES ('catalog', ?)", [JSON.stringify(v)]);
  revalidatePath("/", "layout");
  return Response.json({ ok: true, config: v });
}
