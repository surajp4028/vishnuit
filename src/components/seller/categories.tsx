"use client";
import { useState } from "react";
import { Check, ExternalLink, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, btnDark, card, input } from "@/components/store/ui";

type Cat = { id: number; name: string; slug: string; count: number };

export function CategoriesManager({ initial, handle }: { initial: Cat[]; handle: string }) {
  const [cats, setCats] = useState(initial);
  const [name, setName] = useState("");
  const [edit, setEdit] = useState<{ id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const merge = (list: { id: number; name: string; slug: string }[]) => setCats(list.map((c) => ({ ...c, count: cats.find((x) => x.id === c.id)?.count ?? 0 })));

  async function run(p: Promise<{ ok: boolean; data: { categories?: Cat[]; error?: string } }>) {
    setBusy(true); setErr("");
    const r = await p;
    setBusy(false);
    if (r.ok && r.data.categories) { merge(r.data.categories); return true; }
    setErr(r.data.error || "Something went wrong."); return false;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={async (e) => { e.preventDefault(); if (name.trim() && (await run(api("/api/store/categories", "POST", { name })))) setName(""); }} className={cn(card, "flex gap-2 p-3")}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category, e.g. Kurta Sets" maxLength={80} className={input} />
        <button disabled={busy || name.trim().length < 2} className={cn(btnDark, "shrink-0")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /><span className="hidden sm:inline">Add</span></>}</button>
      </form>
      {err && <p className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{err}</p>}
      <div className={cn(card, "divide-y divide-border overflow-hidden")}>
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            {edit?.id === c.id ? (
              <>
                <input autoFocus value={edit.name} onChange={(e) => setEdit({ id: c.id, name: e.target.value })} className={cn(input, "py-2")} />
                <button onClick={async () => { if (await run(api(`/api/store/categories/${c.id}`, "PATCH", { name: edit.name }))) setEdit(null); }} aria-label="Save" className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background"><Check className="size-4" /></button>
                <button onClick={() => setEdit(null)} aria-label="Cancel" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-foreground/5"><X className="size-4" /></button>
              </>
            ) : (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/5 font-display font-bold">{c.name[0]}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{c.name}</span><span className="text-xs text-muted">{c.count} product{c.count === 1 ? "" : "s"}</span></span>
                <a href={`/catalog/@${handle}/shop?c=${c.slug}`} target="_blank" rel="noopener" aria-label="View on store" className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/5"><ExternalLink className="size-4" /></a>
                <button onClick={() => setEdit({ id: c.id, name: c.name })} aria-label="Rename" className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/5"><Pencil className="size-4" /></button>
                <button onClick={() => confirm(`Delete “${c.name}”? Its products stay, just without a category.`) && run(api(`/api/store/categories/${c.id}`, "DELETE"))} aria-label="Delete" className="grid size-9 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 className="size-4" /></button>
              </>
            )}
          </div>
        ))}
        {!cats.length && <p className="p-10 text-center text-sm text-muted">No categories yet — add your first one above.</p>}
      </div>
    </div>
  );
}
