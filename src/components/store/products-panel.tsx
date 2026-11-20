"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, Copy, ExternalLink, Loader2, PackagePlus, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { flattenTree } from "@/lib/category-tree";
import { isColourOption } from "@/lib/colors";
import { ValuesEditor, type Attr } from "@/components/seller/attributes";
import { api, btnDark, btnLight, card, Field, Gallery, imgUrl, inr, input, Toggle } from "./ui";

type Variant = { key: string; price: number | null; stock: number | null; sku?: string | null };
export type P = {
  id: number; category_id: number | null; name: string; slug: string; description: string | null; price: number; compare_price: number | null;
  sku: string | null; stock: number | null; images: string[]; options: { name: string; values: string[]; swatches?: Record<string, string> }[];
  variants: Variant[]; status: "active" | "draft"; featured: boolean;
  gst_rate?: number | null; hsn?: string | null; low_stock?: number | null;
};
export type C = { id: number; name: string; slug: string; parent_id?: number | null; sort?: number };

const cartesian = (opts: { name: string; values: string[] }[]) =>
  opts.filter((o) => o.values.length).reduce<string[]>((acc, o) => (acc.length ? acc.flatMap((a) => o.values.map((v) => `${a} / ${v}`)) : o.values.slice()), []);

/** Stock summary used by the list: total units (null = not tracked) and state vs the low-stock threshold. */
export function stockInfo(p: P) {
  const threshold = p.low_stock ?? 5;
  const tracked = p.variants.length ? p.variants.filter((v) => v.stock != null) : p.stock != null ? [{ stock: p.stock }] : [];
  if (!tracked.length) return { total: null as number | null, state: "untracked" as const, threshold, outVariants: 0 };
  const total = tracked.reduce((n, v) => n + (v.stock ?? 0), 0);
  const outVariants = p.variants.filter((v) => v.stock === 0).length;
  const state = total === 0 ? ("out" as const) : total <= threshold ? ("low" as const) : ("ok" as const);
  return { total, state, threshold, outVariants };
}
const STOCK_BADGE = {
  ok: "bg-emerald-500/10 text-emerald-600", low: "bg-amber-500/15 text-amber-700", out: "bg-red-500/10 text-red-600", untracked: "bg-foreground/5 text-muted",
};
const stockLabel = (s: ReturnType<typeof stockInfo>) => (s.state === "untracked" ? "Not tracked" : s.state === "out" ? "Out of stock" : `${s.total} in stock${s.state === "low" ? " · low" : ""}`);

export function ProductsPanel({ products, setProducts, categories, setCategories, limit, handle, attributes: initialAttrs }: { products: P[]; setProducts: (p: P[]) => void; categories: C[]; setCategories: (c: C[]) => void; limit: number | null; handle: string; attributes: Attr[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "all">("all");
  const [show, setShow] = useState<"all" | "active" | "draft" | "low" | "out">("all");
  const [sort, setSort] = useState<"new" | "name" | "price" | "stock">("new");
  const [edit, setEdit] = useState<P | "new" | null>(null);
  const [dupFrom, setDupFrom] = useState<P | null>(null);
  const [attrs, setAttrs] = useState<Attr[]>(initialAttrs);
  const catName = useMemo(() => Object.fromEntries(flattenTree(categories.map((c) => ({ ...c, parent_id: c.parent_id ?? null, sort: Number(c.sort ?? 0) }))).map((c) => [c.id, c.label])), [categories]);
  const counts = useMemo(() => {
    const s = products.map(stockInfo);
    return { all: products.length, active: products.filter((p) => p.status === "active").length, draft: products.filter((p) => p.status === "draft").length, low: s.filter((x) => x.state === "low").length, out: s.filter((x) => x.state === "out").length };
  }, [products]);
  const list = useMemo(() => {
    const ql = q.toLowerCase();
    const out = products.filter((p) => {
      const s = stockInfo(p);
      return (cat === "all" || p.category_id === cat) &&
        (show === "all" || (show === "active" || show === "draft" ? p.status === show : s.state === show)) &&
        (!ql || p.name.toLowerCase().includes(ql) || (p.sku ?? "").toLowerCase().includes(ql) || p.variants.some((v) => (v.sku ?? "").toLowerCase().includes(ql)));
    });
    if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price") out.sort((a, b) => a.price - b.price);
    if (sort === "stock") out.sort((a, b) => (stockInfo(a).total ?? 1e9) - (stockInfo(b).total ?? 1e9));
    return out;
  }, [products, q, cat, show, sort]);
  const full = limit != null && products.length >= limit;
  const view = (p: P) => `/catalog/@${handle}/p/${p.slug}`;

  async function quick(p: P, patch: Partial<P>) {
    setProducts(products.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    await api(`/api/store/products/${p.id}`, "PATCH", { quick: true, ...patch });
  }
  const onSaved = (p: P) => {
    setProducts(products.some((x) => x.id === p.id) ? products.map((x) => (x.id === p.id ? p : x)) : [p, ...products]);
    // keep the local attribute library in step with what the server merged
    setAttrs((lib) => {
      const next = lib.map((a) => ({ ...a, values: [...a.values] }));
      for (const o of p.options) {
        const a = next.find((x) => x.name.toLowerCase() === o.name.toLowerCase());
        if (!a) next.push({ name: o.name, values: [...o.values], swatches: o.swatches });
        else for (const v of o.values) if (!a.values.includes(v)) a.values.push(v);
      }
      return next;
    });
    setEdit(null); setDupFrom(null);
  };

  const Actions = ({ p }: { p: P }) => (
    <div className="flex items-center gap-1">
      <a href={view(p)} target="_blank" rel="noopener" title="View on store (new tab)" className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground"><ExternalLink className="size-4" /></a>
      <button onClick={() => { setDupFrom(p); setEdit("new"); }} disabled={full} title="Duplicate" className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground disabled:opacity-30"><Copy className="size-4" /></button>
      <button onClick={() => setEdit(p)} title="Edit" className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground"><Pencil className="size-4" /></button>
    </div>
  );
  const LiveToggle = ({ p }: { p: P }) => (
    <button onClick={() => quick(p, { status: p.status === "active" ? "draft" : "active" })} title={p.status === "active" ? "Live — tap to hide" : "Hidden — tap to publish"} className="flex items-center gap-2 text-xs font-semibold">
      <span className={cn("relative h-5 w-9 rounded-full transition", p.status === "active" ? "bg-emerald-500" : "bg-foreground/15")}><span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", p.status === "active" ? "left-[18px]" : "left-0.5")} /></span>
      <span className={p.status === "active" ? "text-emerald-600" : "text-muted"}>{p.status === "active" ? "Live" : "Draft"}</span>
    </button>
  );

  return (
    <div>
      {/* toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU" className={cn(input, "pl-11")} />
        </div>
        <div className="flex gap-2">
          <select value={cat} onChange={(e) => setCat(e.target.value === "all" ? "all" : Number(e.target.value))} className={cn(input, "w-auto min-w-0 flex-1 py-3 text-sm sm:w-44")}>
            <option value="all">All categories</option>
            {Object.entries(catName).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={cn(input, "w-auto py-3 text-sm")}>
            <option value="new">Newest</option><option value="name">Name</option><option value="price">Price</option><option value="stock">Stock (low first)</option>
          </select>
          <button onClick={() => { setDupFrom(null); setEdit("new"); }} disabled={full} className={cn(btnDark, "hidden shrink-0 sm:inline-flex")}><Plus className="size-4" /> Add product</button>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {([["all", "All"], ["active", "Live"], ["draft", "Draft"], ["low", "Low stock"], ["out", "Out of stock"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setShow(k)} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold", show === k ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted")}>
            {(k === "low" || k === "out") && counts[k] > 0 && <AlertTriangle className={cn("size-3.5", show === k ? "" : k === "out" ? "text-red-500" : "text-amber-500")} />}
            {l} <span className={show === k ? "opacity-70" : "opacity-60"}>{counts[k]}</span>
          </button>
        ))}
      </div>
      {limit != null && (
        <div className="mt-3">
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
        <>
          {/* desktop table */}
          <div className={cn(card, "mt-5 hidden overflow-hidden md:block")}>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-foreground/[.02] text-left text-[11px] font-bold tracking-wider text-muted uppercase"><th className="px-4 py-3">Product</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-center">Home</th><th className="px-3 py-3" /></tr></thead>
              <tbody>
                {list.map((p) => {
                  const s = stockInfo(p);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-foreground/[.015]">
                      <td className="px-4 py-3">
                        <button onClick={() => setEdit(p)} className="flex min-w-0 items-center gap-3 text-left">
                          <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {p.images[0] && <img src={imgUrl(p.images[0])!} alt="" className="size-full object-cover" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[22rem] truncate font-semibold">{p.name}</span>
                            <span className="block truncate text-xs text-muted">{[p.category_id ? catName[p.category_id] : "No category", p.variants.length ? `${p.variants.length} variants` : null, p.sku ? `SKU ${p.sku}` : null, p.images.length ? `${p.images.length} photo${p.images.length > 1 ? "s" : ""}` : "No photo"].filter(Boolean).join(" · ")}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap"><b>{inr(p.price)}</b>{p.compare_price ? <span className="block text-xs text-muted line-through">{inr(p.compare_price)}</span> : null}</td>
                      <td className="px-3 py-3"><span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap", STOCK_BADGE[s.state])}>{stockLabel(s)}</span>{s.outVariants > 0 && s.state !== "out" && <span className="mt-1 block text-[11px] text-muted">{s.outVariants} variant{s.outVariants > 1 ? "s" : ""} sold out</span>}</td>
                      <td className="px-3 py-3"><LiveToggle p={p} /></td>
                      <td className="px-3 py-3 text-center"><button onClick={() => quick(p, { featured: !p.featured })} title="Show in Bestsellers on home" className={cn("inline-grid size-8 place-items-center rounded-full", p.featured ? "bg-amber-400/20 text-amber-500" : "text-muted hover:bg-foreground/5")}><Star className={cn("size-4", p.featured && "fill-current")} /></button></td>
                      <td className="px-3 py-3"><Actions p={p} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* phone cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {list.map((p) => {
              const s = stockInfo(p);
              return (
                <div key={p.id} className={cn(card, "min-w-0 p-3")}>
                  <div className="flex min-w-0 gap-3">
                    <button onClick={() => setEdit(p)} className="size-20 shrink-0 overflow-hidden rounded-2xl bg-foreground/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images[0] && <img src={imgUrl(p.images[0])!} alt="" className="size-full object-cover" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => setEdit(p)} className="block w-full truncate text-left font-semibold">{p.name}</button>
                      <p className="truncate text-xs text-muted">{p.category_id ? catName[p.category_id] : "No category"}{p.variants.length ? ` · ${p.variants.length} variants` : ""}</p>
                      <p className="mt-1 text-sm"><b>{inr(p.price)}</b>{p.compare_price ? <span className="ml-1.5 text-xs text-muted line-through">{inr(p.compare_price)}</span> : null}</p>
                      <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", STOCK_BADGE[s.state])}>{stockLabel(s)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                    <div className="flex items-center gap-3">
                      <LiveToggle p={p} />
                      <button onClick={() => quick(p, { featured: !p.featured })} className={cn("grid size-8 place-items-center rounded-full", p.featured ? "bg-amber-400/20 text-amber-500" : "text-muted")}><Star className={cn("size-4", p.featured && "fill-current")} /></button>
                    </div>
                    <Actions p={p} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!full && <button onClick={() => { setDupFrom(null); setEdit("new"); }} aria-label="Add product" className="fixed right-5 bottom-24 z-30 grid size-14 place-items-center rounded-full bg-foreground text-background shadow-2xl sm:hidden"><Plus className="size-6" /></button>}

      {edit && (
        <ProductEditor
          initial={edit === "new" ? null : edit}
          copyFrom={edit === "new" ? dupFrom : null}
          categories={categories}
          setCategories={setCategories}
          attributes={attrs}
          onClose={() => { setEdit(null); setDupFrom(null); }}
          onSaved={onSaved}
          onDeleted={(id) => { setProducts(products.filter((x) => x.id !== id)); setEdit(null); }}
        />
      )}
    </div>
  );
}

type Opt = { name: string; values: string[]; swatches: Record<string, string> };

function ProductEditor({ initial, copyFrom, categories, setCategories, attributes, onClose, onSaved, onDeleted }: { initial: P | null; copyFrom: P | null; categories: C[]; setCategories: (c: C[]) => void; attributes: Attr[]; onClose: () => void; onSaved: (p: P) => void; onDeleted: (id: number) => void }) {
  const src = initial ?? copyFrom;
  const [f, setF] = useState(() => ({
    name: initial ? initial.name : copyFrom ? `${copyFrom.name} (copy)` : "",
    price: src ? String(src.price) : "", compare_price: src?.compare_price ? String(src.compare_price) : "",
    description: src?.description ?? "", sku: initial?.sku ?? "", gst_rate: src?.gst_rate == null ? "" : String(Number(src.gst_rate)), hsn: src?.hsn ?? "",
    stock: src?.stock == null ? "" : String(src.stock), low_stock: src?.low_stock == null ? "" : String(src.low_stock),
    category_id: src?.category_id ?? null as number | null, images: src?.images ?? [], status: initial?.status ?? "active", featured: initial?.featured ?? false,
    options: (src?.options ?? []).map((o) => ({ name: o.name, values: [...o.values], swatches: o.swatches ?? {} })) as Opt[],
    variants: (src?.variants ?? []).map((v) => ({ ...v, sku: initial ? v.sku ?? null : null })) as Variant[],
  }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newParent, setNewParent] = useState<number | "">("");
  const [askDelete, setAskDelete] = useState(false);
  const [bulkStock, setBulkStock] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const opts = f.options.map((o) => ({ name: o.name.trim(), values: o.values, ...(isColourOption(o.name) ? { swatches: o.swatches } : {}) })).filter((o) => o.name && o.values.length);
  const keys = cartesian(opts);
  const variants = keys.map((k) => f.variants.find((v) => v.key === k) ?? { key: k, price: null, stock: null, sku: null });
  const setVariant = (key: string, patch: Partial<Variant>) => set("variants", [...variants.filter((x) => x.key !== key), { ...variants.find((x) => x.key === key)!, ...patch }]);
  const tree = flattenTree(categories.map((c) => ({ ...c, parent_id: c.parent_id ?? null, sort: Number(c.sort ?? 0) })));
  const tops = tree.filter((c) => c.depth === 0);
  const unusedAttrs = attributes.filter((a) => !f.options.some((o) => o.name.trim().toLowerCase() === a.name.toLowerCase()));
  const totalStock = variants.length ? (variants.some((v) => v.stock != null) ? variants.reduce((n, v) => n + (v.stock ?? 0), 0) : null) : f.stock === "" ? null : Number(f.stock);

  async function addCategory() {
    if (newCat.trim().length < 2) return;
    const r = await api<{ categories: C[] }>("/api/store/categories", "POST", { name: newCat, parent_id: newParent || null });
    if (r.ok) { setCategories(r.data.categories); const c = r.data.categories.find((x) => x.name === newCat.trim() && (x.parent_id ?? null) === (newParent || null)); if (c) set("category_id", c.id); setNewCat(""); }
    else setErr(r.data.error || "Could not add category");
  }
  async function save() {
    setErr(""); setBusy(true);
    const body = { ...f, options: opts, variants };
    const r = initial ? await api<{ product: P }>(`/api/store/products/${initial.id}`, "PATCH", body) : await api<{ product: P }>("/api/store/products", "POST", body);
    setBusy(false);
    if (r.ok) onSaved(r.data.product); else setErr(r.data.error || "Could not save");
  }
  async function remove(withImages: boolean) {
    if (!initial) return;
    setBusy(true); setAskDelete(false);
    const r = await api<{ warning?: string }>(`/api/store/products/${initial.id}${withImages ? "?images=1" : ""}`, "DELETE");
    setBusy(false);
    if (r.ok) { if (r.data.warning) alert(r.data.warning); onDeleted(initial.id); } else setErr(r.data.error || "Could not delete");
  }
  const section = "space-y-4 rounded-[1.4rem] border border-border p-4 sm:p-5";
  const h = (t: string, sub?: string) => <div><p className="font-display text-[15px] font-bold">{t}</p>{sub && <p className="text-xs text-muted">{sub}</p>}</div>;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background sm:items-center sm:justify-center sm:bg-black/50 sm:p-6">
      <div className="flex h-full w-full flex-col bg-background sm:h-auto sm:max-h-[94dvh] sm:max-w-3xl sm:rounded-[2rem] sm:border sm:border-border">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5"><ChevronLeft className="size-5 sm:hidden" /><X className="hidden size-5 sm:block" /></button>
          <h2 className="flex-1 font-display text-lg font-bold">{initial ? "Edit product" : copyFrom ? "Duplicate product" : "New product"}</h2>
          {initial && <button onClick={() => setAskDelete(true)} disabled={busy} aria-label="Delete" className="grid size-10 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 className="size-4.5" /></button>}
        </header>
        {askDelete && initial && (
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={() => setAskDelete(false)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
              <p className="font-display text-lg font-bold">Delete “{initial.name}”?</p>
              <p className="mt-1 text-sm text-muted">This can&apos;t be undone. Past orders keep their details.</p>
              <div className="mt-5 grid gap-2">
                <button onClick={() => remove(false)} className="rounded-2xl border border-border px-4 py-3 text-left text-sm hover:border-foreground/40"><b className="block">Delete product only</b><span className="text-xs text-muted">Photos stay in your media library.</span></button>
                <button onClick={() => remove(true)} className="rounded-2xl border border-red-500/40 bg-red-500/[.04] px-4 py-3 text-left text-sm text-red-600 hover:bg-red-500/10"><b className="block">Delete product + its photos</b><span className="text-xs opacity-80">Also removes {initial.images.length} photo{initial.images.length === 1 ? "" : "s"} from storage.</span></button>
                <button onClick={() => setAskDelete(false)} className="py-2 text-sm font-semibold text-muted">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <div className={section}><Gallery value={f.images} onChange={(v) => set("images", v)} /></div>

          <div className={section}>
            {h("Basics")}
            <Field label="Product name"><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Cotton Kurta Set" className={input} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)"><input value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="999" className={input} /></Field>
              <Field label="MRP (₹)" hint="Shown struck-through"><input value={f.compare_price} onChange={(e) => set("compare_price", e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="1499" className={input} /></Field>
            </div>
            <Field label="Description"><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Fabric, fit, care, what's included…" className={cn(input, "resize-y")} /></Field>
          </div>

          <div className={section}>
            {h("Category")}
            <div className="space-y-2">
              <button type="button" onClick={() => set("category_id", null)} className={cn("rounded-full border px-4 py-2 text-[13px] font-semibold", f.category_id == null ? "border-foreground bg-foreground text-background" : "border-border text-muted")}>No category</button>
              {tops.map((t) => {
                const kids = tree.filter((c) => c.parent_id === t.id);
                return (
                  <div key={t.id} className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border p-1.5">
                    <button type="button" onClick={() => set("category_id", t.id)} className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-bold", f.category_id === t.id ? "bg-foreground text-background" : "hover:bg-foreground/5")}>{t.name}</button>
                    {kids.length > 0 && <span className="text-muted">›</span>}
                    {kids.map((k) => <button type="button" key={k.id} onClick={() => set("category_id", k.id)} className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-semibold", f.category_id === k.id ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground")}>{k.name}</button>)}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 rounded-2xl bg-foreground/[.03] p-2.5 sm:flex-row">
              <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder={newParent ? "New sub-category, e.g. Top wear" : "New category, e.g. Mens"} className={cn(input, "py-2.5")} />
              <select value={newParent} onChange={(e) => setNewParent(e.target.value ? Number(e.target.value) : "")} className={cn(input, "py-2.5 sm:w-48")}>
                <option value="">Main category</option>
                {tops.map((t) => <option key={t.id} value={t.id}>Inside “{t.name}”</option>)}
              </select>
              <button type="button" onClick={addCategory} disabled={newCat.trim().length < 2} className={cn(btnLight, "py-2.5 disabled:opacity-40")}><Plus className="size-4" /> Add</button>
            </div>
          </div>

          <div className={section}>
            {h("Options & variants", "Sizes, colours… each combination gets its own price, stock and SKU.")}
            {f.options.map((o, i) => {
              const lib = attributes.find((a) => a.name.toLowerCase() === o.name.trim().toLowerCase());
              const suggestions = lib ? lib.values.filter((v) => !o.values.includes(v)) : [];
              return (
                <div key={i} className="space-y-2.5 rounded-2xl bg-foreground/[.025] p-3">
                  <div className="flex items-center gap-2">
                    <input value={o.name} list="attr-names" onChange={(e) => set("options", f.options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Option name, e.g. Size" className={cn(input, "py-2 font-semibold")} />
                    <button type="button" onClick={() => set("options", f.options.filter((_, j) => j !== i))} aria-label="Remove option" className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-foreground/10"><X className="size-4" /></button>
                  </div>
                  <ValuesEditor attr={o} onChange={(a) => set("options", f.options.map((x, j) => (j === i ? { name: a.name, values: a.values, swatches: a.swatches ?? {} } : x)))} />
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muted">From library:</span>
                      {suggestions.map((v) => <button type="button" key={v} onClick={() => set("options", f.options.map((x, j) => (j === i ? { ...x, values: [...x.values, v], swatches: lib?.swatches?.[v] ? { ...x.swatches, [v]: lib.swatches[v] } : x.swatches } : x)))} className="rounded-full border border-dashed border-border px-2.5 py-1 font-semibold text-muted hover:border-foreground/40 hover:text-foreground">+ {v}</button>)}
                    </div>
                  )}
                </div>
              );
            })}
            <datalist id="attr-names">{attributes.map((a) => <option key={a.name} value={a.name} />)}</datalist>
            {f.options.length < 3 && (
              <div className="flex flex-wrap items-center gap-2">
                {unusedAttrs.slice(0, 6).map((a) => <button type="button" key={a.name} onClick={() => set("options", [...f.options, { name: a.name, values: [...a.values], swatches: { ...(a.swatches ?? {}) } }])} className="rounded-full bg-foreground px-3.5 py-2 text-xs font-bold text-background">+ {a.name}</button>)}
                <button type="button" onClick={() => set("options", [...f.options, { name: "", values: [], swatches: {} }])} className="rounded-full border border-border px-3.5 py-2 text-xs font-bold"><Plus className="mr-1 inline size-3.5" />Custom option</button>
                {!attributes.length && <span className="text-xs text-muted">Tip: options you create here are saved to Attributes for next time.</span>}
              </div>
            )}
            {variants.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="flex flex-wrap items-center gap-2 border-b border-border bg-foreground/[.03] px-3 py-2">
                  <span className="text-xs font-semibold text-muted">{variants.length} variants{totalStock != null ? ` · ${totalStock} in stock` : ""}</span>
                  <span className="ml-auto flex items-center gap-1.5 text-xs">
                    <input value={bulkStock} onChange={(e) => setBulkStock(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Stock" className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none" />
                    <button type="button" disabled={bulkStock === ""} onClick={() => set("variants", variants.map((v) => ({ ...v, stock: Number(bulkStock) })))} className="rounded-lg bg-foreground px-2.5 py-1.5 font-bold text-background disabled:opacity-40">Set all</button>
                  </span>
                </div>
                <div className="hidden grid-cols-[1fr_88px_76px_110px] gap-2 px-3 py-2 text-[10.5px] font-bold tracking-wider text-muted uppercase sm:grid"><span>Variant</span><span>Price ₹</span><span>Stock</span><span>SKU</span></div>
                {variants.map((v) => (
                  <div key={v.key} className={cn("grid grid-cols-[1fr_76px_64px] items-center gap-2 border-t border-border px-3 py-2 sm:grid-cols-[1fr_88px_76px_110px]", v.stock === 0 && "bg-red-500/[.03]")}>
                    <span className="truncate text-sm font-medium">{v.key}{v.stock === 0 && <span className="ml-1.5 text-[10px] font-bold text-red-500">SOLD OUT</span>}</span>
                    <input value={v.price ?? ""} onChange={(e) => setVariant(v.key, { price: e.target.value === "" ? null : Number(e.target.value.replace(/[^\d.]/g, "")) })} inputMode="decimal" placeholder={f.price || "—"} className="rounded-xl border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-foreground/40" />
                    <input value={v.stock ?? ""} onChange={(e) => setVariant(v.key, { stock: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) })} inputMode="numeric" placeholder="∞" className="rounded-xl border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-foreground/40" />
                    <input value={v.sku ?? ""} onChange={(e) => setVariant(v.key, { sku: e.target.value })} placeholder="SKU" className="col-span-3 rounded-xl border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-foreground/40 sm:col-span-1" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={section}>
            {h("Inventory", variants.length ? "Stock is set per variant above." : "Leave stock empty if you don't track it.")}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {!variants.length && <Field label="Stock"><input value={f.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="∞" className={input} /></Field>}
              <Field label={variants.length ? "Product SKU (optional)" : "SKU (optional)"}><input value={f.sku} onChange={(e) => set("sku", e.target.value)} className={input} /></Field>
              <Field label="Low stock alert at" hint="Shows “Only X left” and a low-stock badge"><input value={f.low_stock} onChange={(e) => set("low_stock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="5" className={input} /></Field>
            </div>
            {totalStock != null && <p className={cn("rounded-xl px-3 py-2 text-xs font-semibold", totalStock === 0 ? "bg-red-500/10 text-red-600" : totalStock <= (Number(f.low_stock) || 5) ? "bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700")}>{totalStock === 0 ? "Out of stock" : `${totalStock} units in stock${totalStock <= (Number(f.low_stock) || 5) ? " — running low" : ""}`}</p>}
          </div>

          <div className={section}>
            {h("Tax")}
            <Field label="GST on this product" hint="e.g. 28% for some accessories. “Store default” uses Settings → GST.">
              <div className="flex flex-wrap gap-2">
                {[["", "Store default"], ["0", "0%"], ["3", "3%"], ["5", "5%"], ["12", "12%"], ["18", "18%"], ["28", "28%"]].map(([v, l]) => (
                  <button type="button" key={l} onClick={() => set("gst_rate", v)} className={cn("rounded-full border px-3.5 py-2 text-[13px] font-semibold", f.gst_rate === v ? "border-foreground bg-foreground text-background" : "border-border text-muted")}>{l}</button>
                ))}
              </div>
              <input value={f.hsn} onChange={(e) => set("hsn", e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" placeholder="HSN code (optional), e.g. 6204" className={cn(input, "mt-2.5 py-2.5")} />
            </Field>
          </div>

          <div className="space-y-2.5">
            <Toggle on={f.status === "active"} onChange={(v) => set("status", v ? "active" : "draft")} label="Show in store" sub="Turn off to hide without deleting" />
            <Toggle on={f.featured} onChange={(v) => set("featured", v)} label="Feature on home page" />
          </div>
        </div>
        <footer className="border-t border-border p-4">
          {err && <p className="mb-3 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{err}</p>}
          <button onClick={save} disabled={busy} className={cn(btnDark, "w-full py-3.5")}>{busy ? <Loader2 className="size-4 animate-spin" /> : initial ? "Save changes" : copyFrom ? "Create copy" : "Add product"}</button>
        </footer>
      </div>
    </div>
  );
}
