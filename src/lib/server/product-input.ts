import "server-only";
import { num, str } from "./store-auth";
import { isCatalogKey } from "./s3";



/** Validate a product form coming from the merchant dashboard. */
export function parseProduct(b: Record<string, unknown>, storeCode: string, categoryIds: number[]) {
  const name = str(b.name, 160);
  if (name.length < 2) return { error: "Enter the product name." } as const;
  const price = num(b.price);
  if (price == null) return { error: "Enter a valid price." } as const;
  const compare = num(b.compare_price);
  const stockRaw = b.stock === "" || b.stock == null ? null : Math.max(0, Math.floor(Number(b.stock)));
  const images = (Array.isArray(b.images) ? b.images : []).filter((k): k is string => isCatalogKey(k, storeCode, "product")).slice(0, 10);
  const options = (Array.isArray(b.options) ? b.options : [])
    .map((o: { name?: unknown; values?: unknown; swatches?: unknown }) => {
      const values = (Array.isArray(o?.values) ? o.values : String(o?.values ?? "").split(",")).map((v: unknown) => str(v, 40)).filter(Boolean).slice(0, 30);
      // Colour swatches: only for listed values, only #rrggbb.
      const sw = o?.swatches && typeof o.swatches === "object" ? (o.swatches as Record<string, unknown>) : {};
      const swatches = Object.fromEntries(values.filter((v) => typeof sw[v] === "string" && /^#[0-9a-f]{6}$/i.test(sw[v] as string)).map((v) => [v, String(sw[v]).toLowerCase()]));
      return { name: str(o?.name, 30), values, ...(Object.keys(swatches).length ? { swatches } : {}) };
    })
    .filter((o) => o.name && o.values.length)
    .slice(0, 3);
  const variants = (Array.isArray(b.variants) ? b.variants : [])
    .map((v: { key?: unknown; price?: unknown; stock?: unknown; sku?: unknown }) => ({ key: str(v?.key, 120), price: num(v?.price), stock: v?.stock === "" || v?.stock == null ? null : Math.max(0, Math.floor(Number(v.stock))), sku: str(v?.sku, 60) || null }))
    .filter((v) => v.key)
    .slice(0, 200);
  const cat = b.category_id ? Number(b.category_id) : null;
  // GST slab for this product (empty = use the store's default rate).
  const gstIn = b.gst_rate === "" || b.gst_rate == null ? null : Number(b.gst_rate);
  if (gstIn != null && ![0, 3, 5, 12, 18, 28].includes(gstIn)) return { error: "Choose a GST rate: 0, 3, 5, 12, 18 or 28%." } as const;
  const hsn = str(b.hsn, 12).replace(/\D/g, "") || null;
  return {
    data: {
      name, price, compare_price: compare && compare > price ? compare : null,
      description: str(b.description, 10000) || null, sku: str(b.sku, 60) || null,
      stock: Number.isFinite(stockRaw as number) ? stockRaw : null,
      category_id: cat && categoryIds.includes(cat) ? cat : null,
      images, options, variants,
      status: b.status === "draft" ? "draft" : "active",
      featured: b.featured ? 1 : 0,
      gst_rate: gstIn, hsn,
      low_stock: b.low_stock === "" || b.low_stock == null ? null : Math.min(9999, Math.max(0, Math.floor(Number(b.low_stock) || 0))),
    },
  } as const;
}
