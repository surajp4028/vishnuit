import "server-only";
import { revalidatePath } from "next/cache";
import { COLLECTIONS, JSON_TYPES, type Collection } from "@/lib/collections";
import { slugify } from "@/lib/utils";

export function getCollection(key: string): Collection | null {
  return COLLECTIONS[key] ?? null;
}

/** Turn client JSON into a safe column→value map using the collection schema. */
export function toRow(c: Collection, body: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const f of c.fields) {
    if (!(f.name in body)) continue;
    let v = body[f.name];
    if (JSON_TYPES.includes(f.type)) v = JSON.stringify(Array.isArray(v) ? v : []);
    else if (f.type === "bool") v = v ? 1 : 0;
    else if (f.type === "number") v = Number.isFinite(Number(v)) ? Number(v) : 0;
    else v = v == null ? null : String(v);
    row[f.name] = v;
  }
  const hasSlug = c.fields.some((f) => f.name === "slug");
  if (hasSlug && !row.slug) row.slug = slugify(String(body.title ?? body.name ?? Date.now()));
  else if (hasSlug) row.slug = slugify(String(row.slug));
  for (const f of c.fields) if (f.required && (row[f.name] === "" || row[f.name] == null)) throw new Error(`${f.label} is required`);
  return row;
}

/** Parse JSON columns coming back from MariaDB (stored as LONGTEXT). */
export function fromRow(c: Collection, r: Record<string, unknown>) {
  const out = { ...r };
  for (const f of c.fields) {
    if (JSON_TYPES.includes(f.type) && typeof out[f.name] === "string") {
      try { out[f.name] = JSON.parse(out[f.name] as string); } catch { out[f.name] = []; }
    }
    if (f.type === "bool") out[f.name] = Number(out[f.name]) === 1;
  }
  return out;
}

export function refreshSite() {
  revalidatePath("/", "layout");
}
