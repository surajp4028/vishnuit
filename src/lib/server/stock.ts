import "server-only";
import { exec, queryOne } from "./db";
import { hydrateProduct } from "./catalog";

/** Put stock back (sign 1) or take it again (sign -1) for an order's items. */
export async function restock(items: { id: number; variant: string | null; qty: number }[], storeId: number, sign: 1 | -1) {
  for (const i of items) {
    const r = await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE id=? AND store_id=?", [i.id, storeId]);
    if (!r) continue;
    if (i.variant) {
      const p = hydrateProduct(r);
      const variants = p.variants.map((v) => (v.key === i.variant && v.stock != null ? { ...v, stock: Math.max(0, v.stock + sign * i.qty) } : v));
      await exec("UPDATE store_products SET variants=? WHERE id=?", [JSON.stringify(variants), i.id]);
    } else {
      await exec("UPDATE store_products SET stock=GREATEST(0, stock+?) WHERE id=? AND stock IS NOT NULL", [sign * i.qty, i.id]);
    }
  }
}
