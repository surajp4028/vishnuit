/** Two-level category tree helpers (top-level categories with optional sub-categories). */
export type TreeCat = { id: number; parent_id: number | null; name: string; slug: string; sort: number };

/** Flat list in display order: each parent followed by its children. Orphans become top-level. */
export function flattenTree<T extends TreeCat>(cats: T[]): (T & { depth: 0 | 1; label: string })[] {
  const by = (a: T, b: T) => a.sort - b.sort || a.name.localeCompare(b.name);
  const ids = new Set(cats.map((c) => c.id));
  const top = cats.filter((c) => c.parent_id == null || !ids.has(c.parent_id)).sort(by);
  const out: (T & { depth: 0 | 1; label: string })[] = [];
  for (const t of top) {
    out.push({ ...t, depth: 0, label: t.name });
    for (const c of cats.filter((x) => x.parent_id === t.id).sort(by)) out.push({ ...c, depth: 1, label: `${t.name} › ${c.name}` });
  }
  return out;
}

/** A category plus all its sub-category ids (for filtering products). */
export const withChildren = (cats: TreeCat[], id: number) => [id, ...cats.filter((c) => c.parent_id === id).map((c) => c.id)];
