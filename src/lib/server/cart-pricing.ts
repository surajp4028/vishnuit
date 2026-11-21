import "server-only";
import { query } from "./db";
import { hydrateProduct, type Store } from "./catalog";

type RawLine = { id?: unknown; variant?: unknown; qty?: unknown };
export type PricedItem = { id: number; name: string; variant: string | null; price: number; qty: number; gst_rate: number | null; hsn: string | null };

/**
 * Turn a shopper's cart into lines priced from the DATABASE (never from the browser):
 * merges duplicates, checks the product is live, the option exists and stock is enough.
 * Shared by checkout's live quote and by order placement so both always agree.
 */
export async function priceCart(store: Pick<Store, "id">, raw: unknown): Promise<{ items: PricedItem[]; itemsTotal: number } | { error: string; status: number }> {
  const merged = new Map<string, { id: number; variant: string | null; qty: number }>();
  for (const l of Array.isArray(raw) ? (raw as RawLine[]) : []) {
    const id = Number(l?.id);
    const qty = Math.floor(Number(l?.qty));
    if (!Number.isInteger(id) || !(qty >= 1)) continue;
    const variant = typeof l?.variant === "string" ? l.variant : null;
    const k = `${id}|${variant ?? ""}`;
    merged.set(k, { id, variant, qty: Math.min(99, (merged.get(k)?.qty ?? 0) + qty) });
  }
  const lines = [...merged.values()].slice(0, 50);
  if (!lines.length) return { error: "Your cart is empty.", status: 422 };
  const ids = [...new Set(lines.map((l) => l.id))];
  const rows = (await query<Record<string, unknown>>(`SELECT * FROM store_products WHERE store_id=? AND status='active' AND id IN (${ids.map(() => "?").join(",")})`, [store.id, ...ids])).map(hydrateProduct);

  const items: PricedItem[] = [];
  for (const l of lines) {
    const p = rows.find((r) => r.id === l.id);
    if (!p) return { error: "Some items are no longer available. Please refresh your cart.", status: 409 };
    let price = p.price;
    let variant: string | null = null;
    let stock = p.stock;
    let label = p.name;
    if (p.variants.length) {
      const v = p.variants.find((x) => x.key === l.variant);
      if (!v) return { error: `Choose an option for ${p.name}.`, status: 422 };
      variant = v.key; price = v.price ?? p.price; stock = v.stock; label = `${p.name} (${v.key})`;
    }
    if (stock === 0) return { error: `${label} is out of stock — please remove it from your bag.`, status: 409 };
    if (stock != null && stock < l.qty) return { error: `Only ${stock} left of ${label}.`, status: 409 };
    items.push({ id: p.id, name: p.name, variant, price, qty: l.qty, gst_rate: p.gst_rate, hsn: p.hsn });
  }
  const itemsTotal = Math.round(items.reduce((n, i) => n + i.price * i.qty, 0) * 100) / 100;
  return { items, itemsTotal };
}
