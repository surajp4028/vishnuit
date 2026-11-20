"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, Loader2, PackagePlus, Plus, Search, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { flattenTree } from "@/lib/category-tree";
import { api, btnDark, btnLight, card, Field, Gallery, imgUrl, inr, input, Toggle } from "./ui";

export type P = {
  id: number; category_id: number | null; name: string; slug: string; description: string | null; price: number; compare_price: number | null;
  sku: string | null; stock: number | null; images: string[]; options: { name: string; values: string[] }[];
  variants: { key: string; price: number | null; stock: number | null }[]; status: "active" | "draft"; featured: boolean;
};
export type C = { id: number; name: string; slug: string; parent_id?: number | null; sort?: number };

const cartesian = (opts: { name: string; values: string[] }[]) =>
  opts.filter((o) => o.values.length).reduce<string[]>((acc, o) => (acc.length ? acc.flatMap((a) => o.values.map((v) => `${a} / ${v}`)) : o.values.slice()), []);

export function ProductsPanel({ products, setProducts, categories, setCategories, limit }: { products: P[]; setProducts: (p: P[]) => void; categories: C[]; setCategories: (c: C[]) => void; limit: number | null }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "all">("all");
  const [edit, setEdit] = useState<P | "new" | null>(null);
  const list = useMemo(() => products.filter((p) => (cat === "all" || p.category_id === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [products, q, cat]);
  const full = limit != null && products.length >= limit;

  async function quick(p: P, patch: Partial<P>) {
    setProducts(products.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    await api(`/api/store/products/${p.id}`, "PATCH", { quick: true, ...patch });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className={cn(input, "pl-11")} />
        </div>
        <button onClick={() => setEdit("new")} disabled={full} className={cn(btnDark, "hidden sm:inline-flex")}><Plus className="size-4" /> Add product</button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[{ id: "all" as const, name: `All (${products.length})` }, ...categories].map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={cn("shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold", cat === c.id ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted")}>{c.name}</button>
        ))}
      </div>
      {limit != null && (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-muted"><span>{products.length} of {limit} products used</span>{full && <span className="text-amber-600">Limit reached — upgrade to add more</span>}</div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10"><div className={cn("h-full rounded-full", full ? "bg-amber-500" : "bg-foreground")} style={{ width: `${Math.min(100, (products.length / limit) * 100)}%` }} /></div>
        </div>
      )}

      {list.length === 0 ? (
        <div className={cn(card, "mt-5 p-10 text-center")}>
          <PackagePlus className="mx-auto size-8 text-muted" />
          <p className="mt-3 font-semibold">{products.length ? "No products match" : "Add your first product"}</p>
          <p className="mt-1 text-sm text-muted">Photos, price, sizes/colours — it takes a minute.</p>
          {!products.length && <button onClick={() => setEdit("new")} className={cn(btnDark, "mt-5")}><Plus className="size-4" /> Add product</button>}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <div key={p.id} className={cn(card, "flex min-w-0 gap-3.5 p-3")}>
              <button onClick={() => setEdit(p)} className="size-24 shrink-0 overflow-hidden rounded-2xl bg-foreground/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.images[0] ? <img src={imgUrl(p.images[0])!} alt="" className="size-full object-cover" /> : null}
              </button>
              <div className="flex min-w-0 flex-1 flex-col">
                <button onClick={() => setEdit(p)} className="block w-full truncate text-left font-semibold">{p.name}</button>
                <p className="mt-0.5 text-sm"><b>{inr(p.price)}</b>{p.compare_price ? <span className="ml-1.5 text-xs text-muted line-through">{inr(p.compare_price)}</span> : null}</p>
                <p className="mt-0.5 text-xs text-muted">{p.variants.length ? `${p.variants.length} variants` : p.stock == null ? "Stock not tracked" : p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}</p>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <button onClick={() => quick(p, { status: p.status === "active" ? "draft" : "active" })} className={cn("rounded-full px-3 py-1 text-[11px] font-bold", p.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground/10 text-muted")}>{p.status === "active" ? "● Live" : "○ Hidden"}</button>
                  <button onClick={() => quick(p, { featured: !p.featured })} aria-label="Feature on home" className={cn("grid size-7 place-items-center rounded-full", p.featured ? "bg-amber-400/20 text-amber-500" : "bg-foreground/5 text-muted")}><Star className={cn("size-3.5", p.featured && "fill-current")} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* phone FAB */}
      {!full && <button onClick={() => setEdit("new")} aria-label="Add product" className="fixed right-5 bottom-24 z-30 grid size-14 place-items-center rounded-full bg-foreground text-background shadow-2xl sm:hidden"><Plus className="size-6" /></button>}

      {edit && (
        <ProductEditor
          initial={edit === "new" ? null : edit}
          categories={categories}
          setCategories={setCategories}
          onClose={() => setEdit(null)}
          onSaved={(p) => { setProducts(edit === "new" ? [p, ...products] : products.map((x) => (x.id === p.id ? p : x))); setEdit(null); }}
          onDeleted={(id) => { setProducts(products.filter((x) => x.id !== id)); setEdit(null); }}
        />
      )}
    </div>
  );
}

function ProductEditor({ initial, categories, setCategories, onClose, onSaved, onDeleted }: { initial: P | null; categories: C[]; setCategories: (c: C[]) => void; onClose: () => void; onSaved: (p: P) => void; onDeleted: (id: number) => void }) {
  const [f, setF] = useState(() => ({
    name: initial?.name ?? "", price: initial ? String(initial.price) : "", compare_price: initial?.compare_price ? String(initial.compare_price) : "",
    description: initial?.description ?? "", sku: initial?.sku ?? "", stock: initial?.stock == null ? "" : String(initial.stock),
    category_id: initial?.category_id ?? null as number | null, images: initial?.images ?? [], status: initial?.status ?? "active", featured: initial?.featured ?? false,
    options: initial?.options.length ? initial.options.map((o) => ({ name: o.name, values: o.values.join(", ") })) : [] as { name: string; values: string }[],
    variants: initial?.variants ?? [],
  }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [newCat, setNewCat] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const opts = f.options.map((o) => ({ name: o.name.trim(), values: o.values.split(",").map((v) => v.trim()).filter(Boolean) })).filter((o) => o.name && o.values.length);
  const keys = cartesian(opts);
  const variants = keys.map((k) => f.variants.find((v) => v.key === k) ?? { key: k, price: null, stock: null });

  async function addCategory() {
    if (newCat.trim().length < 2) return;
    const r = await api<{ categories: C[] }>("/api/store/categories", "POST", { name: newCat });
    if (r.ok) { setCategories(r.data.categories); const c = r.data.categories.find((x) => x.name === newCat.trim()); if (c) set("category_id", c.id); setNewCat(""); }
    else setErr(r.data.error || "Could not add category");
  }
  async function save() {
    setErr(""); setBusy(true);
    const body = { ...f, options: opts, variants };
    const r = initial ? await api<{ product: P }>(`/api/store/products/${initial.id}`, "PATCH", body) : await api<{ product: P }>("/api/store/products", "POST", body);
    setBusy(false);
    if (r.ok) onSaved(r.data.product); else setErr(r.data.error || "Could not save");
  }
  async function remove() {
    if (!initial || !confirm(`Delete “${initial.name}”? This can't be undone.`)) return;
    setBusy(true);
    const r = await api(`/api/store/products/${initial.id}`, "DELETE");
    setBusy(false);
    if (r.ok) onDeleted(initial.id); else setErr(r.data.error || "Could not delete");
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background sm:items-center sm:justify-center sm:bg-black/50 sm:p-6">
      <div className="flex h-full w-full flex-col bg-background sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-[2rem] sm:border sm:border-border">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5"><ChevronLeft className="size-5 sm:hidden" /><X className="hidden size-5 sm:block" /></button>
          <h2 className="flex-1 font-display text-lg font-bold">{initial ? "Edit product" : "New product"}</h2>
          {initial && <button onClick={remove} disabled={busy} aria-label="Delete" className="grid size-10 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 className="size-4.5" /></button>}
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          <Gallery value={f.images} onChange={(v) => set("images", v)} />
          <Field label="Product name"><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Cotton Kurta Set" className={input} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)"><input value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="999" className={input} /></Field>
            <Field label="MRP (₹)" hint="Shown struck-through"><input value={f.compare_price} onChange={(e) => set("compare_price", e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="1499" className={input} /></Field>
          </div>
          <Field label="Category">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => set("category_id", null)} className={cn("shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold", f.category_id == null ? "border-foreground bg-foreground text-background" : "border-border text-muted")}>None</button>
              {flattenTree(categories.map((c) => ({ ...c, parent_id: c.parent_id ?? null, sort: Number(c.sort ?? 0) }))).map((c) => <button type="button" key={c.id} onClick={() => set("category_id", c.id)} className={cn("shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold whitespace-nowrap", f.category_id === c.id ? "border-foreground bg-foreground text-background" : "border-border text-muted")}>{c.label}</button>)}
            </div>
            <div className="mt-2 flex gap-2"><input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className={cn(input, "py-2.5")} /><button type="button" onClick={addCategory} className={btnLight}>Add</button></div>
          </Field>
          <Field label="Description"><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Fabric, fit, care, what's included…" className={cn(input, "resize-y")} /></Field>

          <div>
            <p className="text-[13px] font-semibold">Options (size, colour…)</p>
            <p className="text-xs text-muted">Add values separated by commas. Each combination becomes a variant with its own price and stock.</p>
            <div className="mt-3 space-y-2.5">
              {f.options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input value={o.name} onChange={(e) => set("options", f.options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Size" className={cn(input, "w-28 py-2.5")} />
                  <input value={o.values} onChange={(e) => set("options", f.options.map((x, j) => (j === i ? { ...x, values: e.target.value } : x)))} placeholder="S, M, L, XL" className={cn(input, "py-2.5")} />
                  <button type="button" onClick={() => set("options", f.options.filter((_, j) => j !== i))} aria-label="Remove option" className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-foreground/5"><X className="size-4" /></button>
                </div>
              ))}
              {f.options.length < 3 && <button type="button" onClick={() => set("options", [...f.options, { name: "", values: "" }])} className={cn(btnLight, "py-2.5")}><Plus className="size-4" /> Add option</button>}
            </div>
            {variants.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[1fr_90px_80px] gap-2 bg-foreground/[.03] px-3 py-2 text-[11px] font-bold tracking-wide text-muted"><span>VARIANT</span><span>PRICE ₹</span><span>STOCK</span></div>
                {variants.map((v) => (
                  <div key={v.key} className="grid grid-cols-[1fr_90px_80px] items-center gap-2 border-t border-border px-3 py-2">
                    <span className="truncate text-sm font-medium">{v.key}</span>
                    <input value={v.price ?? ""} onChange={(e) => set("variants", [...variants.filter((x) => x.key !== v.key), { ...v, price: e.target.value === "" ? null : Number(e.target.value.replace(/[^\d.]/g, "")) }])} inputMode="decimal" placeholder={f.price || "—"} className="rounded-xl border border-border bg-background px-2.5 py-2 text-sm outline-none" />
                    <input value={v.stock ?? ""} onChange={(e) => set("variants", [...variants.filter((x) => x.key !== v.key), { ...v, stock: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) }])} inputMode="numeric" placeholder="∞" className="rounded-xl border border-border bg-background px-2.5 py-2 text-sm outline-none" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {!variants.length && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock" hint="Leave empty to not track"><input value={f.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="∞" className={input} /></Field>
              <Field label="SKU (optional)"><input value={f.sku} onChange={(e) => set("sku", e.target.value)} className={input} /></Field>
            </div>
          )}
          <div className="space-y-2.5">
            <Toggle on={f.status === "active"} onChange={(v) => set("status", v ? "active" : "draft")} label="Show in store" sub="Turn off to hide without deleting" />
            <Toggle on={f.featured} onChange={(v) => set("featured", v)} label="Feature on home page" />
          </div>
        </div>
        <footer className="border-t border-border p-4">
          {err && <p className="mb-3 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{err}</p>}
          <button onClick={save} disabled={busy} className={cn(btnDark, "w-full py-3.5")}>{busy ? <Loader2 className="size-4 animate-spin" /> : initial ? "Save changes" : "Add product"}</button>
        </footer>
      </div>
    </div>
  );
}
