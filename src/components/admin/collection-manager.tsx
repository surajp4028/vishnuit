"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLLECTIONS } from "@/lib/collections";
import { FieldInput } from "./fields";

type Item = Record<string, unknown> & { id?: number };

const PUBLIC_PATH: Record<string, string> = { services: "/services/", projects: "/portfolio/", posts: "/blog/" };

export function CollectionManager({ collectionKey, initial }: { collectionKey: string; initial: Item[] }) {
  const c = COLLECTIONS[collectionKey];
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return s ? items.filter((it) => c.listColumns.some((k) => String(it[k] ?? "").toLowerCase().includes(s))) : items;
  }, [items, q, c.listColumns]);

  function blank(): Item {
    const it: Item = {};
    for (const f of c.fields) it[f.name] = f.type === "bool" ? f.name === "published" : ["list", "images", "pairs"].includes(f.type) ? [] : f.type === "number" ? (f.name === "rating" ? 5 : 0) : f.type === "date" ? new Date().toISOString().slice(0, 10) : "";
    return it;
  }

  async function reload() {
    const res = await fetch(`/api/admin/c/${c.key}`);
    if (res.ok) setItems((await res.json()).items);
    router.refresh();
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    const body: Item = { ...editing };
    for (const f of c.fields) if (f.type === "list" && Array.isArray(body[f.name])) body[f.name] = (body[f.name] as string[]).map((s) => s.trim()).filter(Boolean);
    const res = await fetch(editing.id ? `/api/admin/c/${c.key}/${editing.id}` : `/api/admin/c/${c.key}`, {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(json.error || "Save failed");
    setEditing(null);
    reload();
  }

  async function remove(it: Item) {
    if (!confirm(`Delete "${it[c.listColumns[0]]}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/c/${c.key}/${it.id}`, { method: "DELETE" });
    reload();
  }

  async function togglePublished(it: Item) {
    await fetch(`/api/admin/c/${c.key}/${it.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...it, published: !it.published }) });
    reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{c.label}</h1>
          <p className="text-sm text-muted">{items.length} items · changes go live on the website instantly</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full rounded-full border border-border bg-card py-2 pr-4 pl-9 text-sm outline-none focus:border-accent" />
          </div>
          <button onClick={() => { setError(""); setEditing(blank()); }} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"><Plus className="size-4" /> Add {c.singular}</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-foreground/[0.03] text-left text-xs text-muted">
              <tr>
                {c.imageColumn && <th className="w-16 px-4 py-3" />}
                {c.listColumns.map((k) => <th key={k} className="px-4 py-3 font-medium capitalize">{k.replace("_", " ")}</th>)}
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-foreground/[0.02]">
                  {c.imageColumn && (
                    <td className="px-4 py-2.5">
                      <div className="size-10 overflow-hidden rounded-lg border border-border bg-foreground/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {it[c.imageColumn] ? <img src={String(it[c.imageColumn])} alt="" className="size-full object-cover" /> : null}
                      </div>
                    </td>
                  )}
                  {c.listColumns.map((k, i) => (
                    <td key={k} className={cn("px-4 py-2.5", i === 0 ? "font-medium" : "text-muted")}>
                      {k === "price" ? `₹${Number(it[k]).toLocaleString("en-IN")}` : String(it[k] ?? "—").slice(0, 80)}
                      {i === 0 && Boolean(it.featured) && <span className="ml-2 rounded-full bg-[#d4a017]/15 px-2 py-0.5 text-[10px] font-semibold text-[#a07a0c]">Featured</span>}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <button onClick={() => togglePublished(it)} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", it.published ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground/5 text-muted")}>
                      {it.published ? <Eye className="size-3" /> : <EyeOff className="size-3" />} {it.published ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {PUBLIC_PATH[c.key] && typeof it.slug === "string" && <a href={PUBLIC_PATH[c.key] + it.slug} target="_blank" className="mr-1 inline-flex rounded-lg p-2 text-muted hover:bg-foreground/5" aria-label="View"><Eye className="size-4" /></a>}
                    <button onClick={() => { setError(""); setEditing(it); }} className="rounded-lg p-2 text-muted hover:bg-accent/10 hover:text-accent" aria-label="Edit"><Pencil className="size-4" /></button>
                    <button onClick={() => remove(it)} className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-500" aria-label="Delete"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <p className="p-10 text-center text-sm text-muted">Nothing here yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setEditing(null)}>
          <div className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-bold">{editing.id ? "Edit" : "New"} {c.singular}</h2>
              <button onClick={() => setEditing(null)} aria-label="Close"><X className="size-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {c.fields.map((f) => (
                  <label key={f.name} className={cn("block", (f.full || ["list", "images", "pairs", "html", "textarea", "icon", "image"].includes(f.type)) && "sm:col-span-2")}>
                    <span className="mb-1.5 block text-xs font-medium text-muted">{f.label}{f.required && " *"}</span>
                    <FieldInput f={f} value={editing[f.name]} onChange={(v) => setEditing((e) => ({ ...e!, [f.name]: v }))} />
                    {f.help && <span className="mt-1 block text-[11px] text-muted">{f.help}</span>}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
              <p className="text-sm text-red-500">{error}</p>
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2 text-sm">Cancel</button>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {saving && <Loader2 className="size-4 animate-spin" />} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
