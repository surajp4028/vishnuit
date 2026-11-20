import "server-only";
import { exec, query, queryOne } from "./db";
import { str } from "./store-auth";

/** A reusable product attribute (Size, Colour, Material…) kept in the store's library. */
export type Attr = { name: string; values: string[]; swatches?: Record<string, string> };
const HEX = /^#[0-9a-f]{6}$/i;

export function cleanAttributes(input: unknown): Attr[] {
  const seen = new Set<string>();
  return (Array.isArray(input) ? input : []).slice(0, 30).map((a: Record<string, unknown>) => {
    const name = str(a?.name, 30);
    const values = [...new Set((Array.isArray(a?.values) ? a.values : []).map((v: unknown) => str(v, 40)).filter(Boolean))].slice(0, 60);
    const sw = a?.swatches && typeof a.swatches === "object" ? (a.swatches as Record<string, unknown>) : {};
    const swatches = Object.fromEntries(values.filter((v) => typeof sw[v] === "string" && HEX.test(sw[v] as string)).map((v) => [v, String(sw[v]).toLowerCase()]));
    return { name, values, ...(Object.keys(swatches).length ? { swatches } : {}) };
  }).filter((a) => a.name && a.values.length && !seen.has(a.name.toLowerCase()) && seen.add(a.name.toLowerCase()));
}

export async function getAttributes(storeId: number): Promise<Attr[]> {
  const r = await queryOne<{ attributes: unknown }>("SELECT attributes FROM stores WHERE id=?", [storeId]);
  const v = typeof r?.attributes === "string" ? JSON.parse(r.attributes) : r?.attributes;
  if (v == null) {
    // First visit: build the library from options already used on this store's products.
    const rows = await query<{ options: unknown }>("SELECT options FROM store_products WHERE store_id=?", [storeId]);
    const opts = rows.flatMap((x) => ((typeof x.options === "string" ? JSON.parse(x.options) : x.options) as Attr[] | null) ?? []);
    await exec("UPDATE stores SET attributes=? WHERE id=?", ["[]", storeId]);
    await mergeIntoLibrary(storeId, opts.map((o) => cleanAttributes([o])[0]).filter(Boolean));
    const again = await queryOne<{ attributes: unknown }>("SELECT attributes FROM stores WHERE id=?", [storeId]);
    return cleanAttributes(typeof again?.attributes === "string" ? JSON.parse(again.attributes) : again?.attributes ?? []);
  }
  return cleanAttributes(v);
}

/** Add any new option names / values / swatches used on a product to the store's library. */
export async function mergeIntoLibrary(storeId: number, options: Attr[]) {
  if (!options.length) return;
  const lib = await getAttributes(storeId);
  let changed = false;
  for (const o of options) {
    const a = lib.find((x) => x.name.toLowerCase() === o.name.toLowerCase());
    if (!a) { lib.push({ name: o.name, values: [...o.values], ...(o.swatches ? { swatches: { ...o.swatches } } : {}) }); changed = true; continue; }
    for (const v of o.values) if (!a.values.some((x) => x.toLowerCase() === v.toLowerCase())) { a.values.push(v); changed = true; }
    for (const [v, hex] of Object.entries(o.swatches ?? {})) if (!a.swatches?.[v]) { a.swatches = { ...a.swatches, [v]: hex }; changed = true; }
  }
  if (changed) await exec("UPDATE stores SET attributes=? WHERE id=?", [JSON.stringify(cleanAttributes(lib)), storeId]);
}
