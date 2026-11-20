"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, CornerDownRight, ExternalLink, FolderTree, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { flattenTree } from "@/lib/category-tree";
import { api, btnDark, card, input } from "@/components/store/ui";

type Cat = { id: number; parent_id: number | null; name: string; slug: string; sort: number; count: number };
type Raw = Omit<Cat, "count">;

/** Seller → Categories: main categories with sub-categories, reorder with arrows, move between parents. */
export function CategoriesManager({ initial, handle }: { initial: Cat[]; handle: string }) {
  const [cats, setCats] = useState(initial);
  const [name, setName] = useState("");
  const [parent, setParent] = useState<number | "">("");
  const [edit, setEdit] = useState<{ id: number; name: string; parent: number | "" } | null>(null);
  const [subFor, setSubFor] = useState<{ id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const tree = flattenTree(cats);
  const tops = tree.filter((c) => c.depth === 0);
  const merge = (list: Raw[]) => setCats(list.map((c) => ({ ...c, parent_id: c.parent_id ?? null, sort: Number(c.sort), count: cats.find((x) => x.id === c.id)?.count ?? 0 })));

  async function run(p: Promise<{ ok: boolean; data: { categories?: Raw[]; error?: string } }>) {
    setBusy(true); setErr("");
    const r = await p;
    setBusy(false);
    if (r.ok && r.data.categories) { merge(r.data.categories); return true; }
    setErr(r.data.error || "Something went wrong."); return false;
  }

  /** Swap with the previous/next sibling, then save the full order. */
  function move(c: Cat, d: -1 | 1) {
    const sibs = tree.filter((x) => x.parent_id === c.parent_id);
    const i = sibs.findIndex((x) => x.id === c.id);
    const j = i + d;
    if (j < 0 || j >= sibs.length) return;
    const order = sibs.map((x) => x.id);
    [order[i], order[j]] = [order[j], order[i]];
    const rest = tree.filter((x) => x.parent_id !== c.parent_id).map((x) => x.id);
    const full = c.parent_id == null ? [...order, ...rest] : [...rest, ...order];
    setCats(cats.map((x) => ({ ...x, sort: full.indexOf(x.id) })));
    run(api("/api/store/categories", "PATCH", { order: full }));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={async (e) => { e.preventDefault(); if (name.trim() && (await run(api("/api/store/categories", "POST", { name, parent_id: parent || null })))) setName(""); }} className={cn(card, "space-y-2.5 p-3")}>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={parent ? "Sub-category name, e.g. T-Shirts" : "Category name, e.g. Men"} maxLength={80} className={input} />
          <button disabled={busy || name.trim().length < 2} className={cn(btnDark, "shrink-0")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /><span className="hidden sm:inline">Add</span></>}</button>
        </div>
        <label className="flex items-center gap-2 px-1 text-[13px] text-muted">
          <FolderTree className="size-4 shrink-0" /> Put inside
          <select value={parent} onChange={(e) => setParent(e.target.value ? Number(e.target.value) : "")} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[13px] font-semibold text-foreground outline-none">
            <option value="">— Main category (no parent)</option>
            {tops.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      </form>
      {err && <p className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{err}</p>}

      <div className={cn(card, "overflow-hidden")}>
        {tree.map((c) => {
          const sibs = tree.filter((x) => x.parent_id === c.parent_id);
          const pos = sibs.findIndex((x) => x.id === c.id);
          const kids = tree.filter((x) => x.parent_id === c.id).length;
          return (
            <div key={c.id} className={cn("border-b border-border last:border-0", c.depth === 1 && "bg-foreground/[.02]")}>
              {edit?.id === c.id ? (
                <div className={cn("space-y-2 px-4 py-3", c.depth === 1 && "pl-12")}>
                  <input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={cn(input, "py-2")} />
                  <div className="flex items-center gap-2">
                    <select value={edit.parent} disabled={kids > 0} onChange={(e) => setEdit({ ...edit, parent: e.target.value ? Number(e.target.value) : "" })} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[13px] font-semibold outline-none disabled:opacity-50">
                      <option value="">Main category</option>
                      {tops.filter((t) => t.id !== c.id).map((t) => <option key={t.id} value={t.id}>Inside “{t.name}”</option>)}
                    </select>
                    <button onClick={async () => { if (await run(api(`/api/store/categories/${c.id}`, "PATCH", { name: edit.name, parent_id: edit.parent || null }))) setEdit(null); }} aria-label="Save" className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background"><Check className="size-4" /></button>
                    <button onClick={() => setEdit(null)} aria-label="Cancel" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-foreground/5"><X className="size-4" /></button>
                  </div>
                  {kids > 0 && <p className="text-xs text-muted">Has {kids} sub-categor{kids > 1 ? "ies" : "y"}, so it stays a main category.</p>}
                </div>
              ) : (
                <div className={cn("flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4", c.depth === 1 && "pl-6 sm:pl-10")}>
                  <div className="flex flex-col">
                    <button onClick={() => move(c, -1)} disabled={pos === 0 || busy} aria-label="Move up" className="grid size-6 place-items-center rounded text-muted hover:bg-foreground/5 hover:text-foreground disabled:opacity-25"><ArrowUp className="size-3.5" /></button>
                    <button onClick={() => move(c, 1)} disabled={pos === sibs.length - 1 || busy} aria-label="Move down" className="grid size-6 place-items-center rounded text-muted hover:bg-foreground/5 hover:text-foreground disabled:opacity-25"><ArrowDown className="size-3.5" /></button>
                  </div>
                  {c.depth === 1 ? <CornerDownRight className="size-4 shrink-0 text-muted" /> : <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/5 font-display font-bold">{c.name[0]}</span>}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate", c.depth === 0 ? "font-semibold" : "text-[14px] font-medium")}>{c.name}</span>
                    <span className="text-xs text-muted">{c.count} product{c.count === 1 ? "" : "s"}{c.depth === 0 && kids ? ` · ${kids} sub` : ""}</span>
                  </span>
                  {c.depth === 0 && <button onClick={() => setSubFor({ id: c.id, name: "" })} className="hidden shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold sm:inline-flex"><Plus className="size-3.5" /> Sub-category</button>}
                  {c.depth === 0 && <button onClick={() => setSubFor({ id: c.id, name: "" })} aria-label="Add sub-category" className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/5 sm:hidden"><Plus className="size-4" /></button>}
                  <a href={`/catalog/@${handle}/shop?c=${c.slug}`} target="_blank" rel="noopener" aria-label="View on store" className="hidden size-9 place-items-center rounded-full text-muted hover:bg-foreground/5 sm:grid"><ExternalLink className="size-4" /></a>
                  <button onClick={() => setEdit({ id: c.id, name: c.name, parent: c.parent_id ?? "" })} aria-label="Edit" className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/5"><Pencil className="size-4" /></button>
                  <button onClick={() => confirm(`Delete “${c.name}”?${kids ? " Its sub-categories become main categories." : ""} Products stay, just without this category.`) && run(api(`/api/store/categories/${c.id}`, "DELETE"))} aria-label="Delete" className="grid size-9 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 className="size-4" /></button>
                </div>
              )}
              {subFor?.id === c.id && (
                <form onSubmit={async (e) => { e.preventDefault(); if (subFor.name.trim() && (await run(api("/api/store/categories", "POST", { name: subFor.name, parent_id: c.id })))) setSubFor(null); }} className="flex items-center gap-2 border-t border-dashed border-border bg-foreground/[.02] py-2.5 pr-3 pl-10 sm:pl-14">
                  <CornerDownRight className="size-4 shrink-0 text-muted" />
                  <input autoFocus value={subFor.name} onChange={(e) => setSubFor({ ...subFor, name: e.target.value })} placeholder={`New sub-category in ${c.name}`} maxLength={80} className={cn(input, "py-2")} />
                  <button disabled={busy || subFor.name.trim().length < 2} className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-40"><Check className="size-4" /></button>
                  <button type="button" onClick={() => setSubFor(null)} aria-label="Cancel" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-foreground/5"><X className="size-4" /></button>
                </form>
              )}
            </div>
          );
        })}
        {!cats.length && <p className="p-10 text-center text-sm text-muted">No categories yet — add your first one above, e.g. “Men”, then add “T-Shirts”, “Jeans” inside it.</p>}
      </div>
      <p className="px-1 text-xs text-muted">Main categories show in your store&apos;s menu strip; sub-categories appear inside them and in the shop filters. Use the arrows to set the order.</p>
    </div>
  );
}
