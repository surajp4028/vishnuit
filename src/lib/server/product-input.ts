import "server-only";
import { num, str } from "./store-auth";
import { isCatalogKey } from "./s3";
import { query } from "./db";



const MAX_PRICE = 10_000_000;
/** null = not tracked; undefined = not a number (reject); else a whole number 0…1,000,000. */
function toStock(v: unknown): number | null | undefined {
  if (v === "" || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(1_000_000, Math.max(0, Math.floor(n)));
}

/** Validate a product form coming from the merchant dashboard. */
export function parseProduct(b: Record<string, unknown>, storeCode: string, categoryIds: number[]) {
  const name = str(b.name, 160);
  if (name.length < 2) return { error: "Enter the product name." } as const;
  const price = num(b.price);
  if (price == null || price <= 0 || price > MAX_PRICE) return { error: "Enter a valid price (more than ₹0, up to ₹1,00,00,000)." } as const;
  const compareRaw = num(b.compare_price);
  const compare = compareRaw != null && compareRaw <= MAX_PRICE ? compareRaw : null;
  const stockRaw = toStock(b.stock);
  if (stockRaw === undefined) return { error: "Stock must be a whole number." } as const;
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
  // A variant key is "Red / M" — one value per option, in option order. Anything else can never be bought, so drop it.
  const validKey = (k: string) => {
    const parts = k.split(" / ");
    return parts.length === options.length && parts.every((v, i) => options[i].values.includes(v));
  };
  const rawVariants = (Array.isArray(b.variants) ? b.variants : []) as { key?: unknown; price?: unknown; stock?: unknown; sku?: unknown }[];
  const variants = [];
  for (const v of rawVariants.slice(0, 200)) {
    const key = str(v?.key, 120);
    if (!key || !options.length || !validKey(key)) continue;
    const vp = num(v?.price);
    if (vp != null && (vp <= 0 || vp > MAX_PRICE)) return { error: `Enter a valid price for ${key}.` } as const;
    const vs = toStock(v?.stock);
    if (vs === undefined) return { error: `Stock for ${key} must be a whole number.` } as const;
    variants.push({ key, price: vp, stock: vs, sku: str(v?.sku, 60) || null });
  }
  const cat = b.category_id ? Number(b.category_id) : null;
  // GST slab for this product (empty = use the store's default rate).
  const gstIn = b.gst_rate === "" || b.gst_rate == null ? null : Number(b.gst_rate);
  if (gstIn != null && ![0, 3, 5, 12, 18, 28].includes(gstIn)) return { error: "Choose a GST rate: 0, 3, 5, 12, 18 or 28%." } as const;
  const hsn = str(b.hsn, 12).replace(/\D/g, "") || null;
  return {
    data: {
      name, price, compare_price: compare && compare > price ? compare : null,
      description: str(b.description, 10000) || null, sku: str(b.sku, 60) || null,
      stock: stockRaw,
      category_id: cat && categoryIds.includes(cat) ? cat : null,
      images, options, variants,
      status: b.status === "draft" ? "draft" : "active",
      featured: b.featured ? 1 : 0,
      gst_rate: gstIn, hsn,
      video: isCatalogKey(b.video, storeCode, "video") ? (b.video as string) : null,
      related: [...new Set((Array.isArray(b.related) ? b.related : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 12),
      low_stock: b.low_stock === "" || b.low_stock == null ? null : Math.min(9999, Math.max(0, Math.floor(Number(b.low_stock) || 0))),
    },
  } as const;
}

/** Keep only related ids that are products of this store. */
export async function ownIds(storeId: number, ids: number[]) {
  if (!ids.length) return [];
  const ok = new Set((await query<{ id: number }>(`SELECT id FROM store_products WHERE store_id=? AND id IN (${ids.map(() => "?").join(",")})`, [storeId, ...ids])).map((r) => r.id));
  return ids.filter((i) => ok.has(i));
}

/** A product's video must be one this store finished uploading (counted in its storage), or the one it already had. */
export async function ownVideo(storeId: number, key: string | null) {
  if (!key) return null;
  const ok = await query<{ x: number }>(
    "SELECT 1 x FROM store_media WHERE store_id=? AND s3_key=? AND kind='video' UNION SELECT 1 x FROM store_products WHERE store_id=? AND video=? LIMIT 1",
    [storeId, key, storeId, key],
  );
  return ok.length ? key : null;
}
