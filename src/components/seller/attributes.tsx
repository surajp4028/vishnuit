"use client";
import { useState } from "react";
import { Loader2, Plus, Tags, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { guessHex, isColourOption, isLight } from "@/lib/colors";
import { api, btnDark, card, input } from "@/components/store/ui";

export type Attr = { name: string; values: string[]; swatches?: Record<string, string> };
const PRESETS: Attr[] = [
  { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL"] },
  { name: "Colour", values: ["Black", "White", "Navy", "Maroon", "Beige"] },
  { name: "Fit", values: ["Slim", "Regular", "Relaxed"] },
  { name: "Material", values: ["Cotton", "Linen", "Silk", "Georgette"] },
  { name: "Waist", values: ["28", "30", "32", "34", "36"] },
];

/** Values editor: chips + type-and-Enter; colour attributes get a swatch picker per value. */
export function ValuesEditor({ attr, onChange }: { attr: Attr; onChange: (a: Attr) => void }) {
  const [v, setV] = useState("");
  const colour = isColourOption(attr.name);
  const add = (raw: string) => {
    const vals = raw.split(",").map((x) => x.trim()).filter(Boolean).filter((x) => !attr.values.some((y) => y.toLowerCase() === x.toLowerCase()));
    if (vals.length) onChange({ ...attr, values: [...attr.values, ...vals] });
    setV("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {attr.values.map((val) => {
        const hex = attr.swatches?.[val] ?? guessHex(val) ?? "#cccccc";
        return (
          <span key={val} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pr-1.5 pl-1.5 text-[13px] font-semibold">
            {colour && (
              <label className={cn("relative size-6 cursor-pointer overflow-hidden rounded-full", isLight(hex) && "ring-1 ring-black/15")} style={{ background: hex }} title="Pick colour">
                <input type="color" value={hex} onChange={(e) => onChange({ ...attr, swatches: { ...attr.swatches, [val]: e.target.value } })} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
            )}
            <span className={colour ? "" : "pl-1.5"}>{val}</span>
            <button type="button" onClick={() => onChange({ ...attr, values: attr.values.filter((x) => x !== val) })} aria-label={`Remove ${val}`} className="grid size-5 place-items-center rounded-full text-muted hover:bg-foreground/10"><X className="size-3" /></button>
          </span>
        );
      })}
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(v); } }} onBlur={() => v.trim() && add(v)} placeholder={attr.values.length ? "Add value…" : "Type a value, press Enter"} className="min-w-28 flex-1 rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 text-[13px] outline-none focus:border-foreground/40" />
    </div>
  );
}

export function AttributesManager({ initial }: { initial: Attr[] }) {
  const [list, setList] = useState<Attr[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const missing = PRESETS.filter((p) => !list.some((a) => a.name.toLowerCase() === p.name.toLowerCase()));
  async function save() {
    setBusy(true); setMsg(null);
    const r = await api<{ attributes: Attr[] }>("/api/store/attributes", "PUT", { attributes: list.filter((a) => a.name.trim()) });
    setBusy(false);
    if (r.ok) { setList(r.data.attributes); setMsg({ ok: true, t: "Saved." }); } else setMsg({ ok: false, t: r.data.error || "Could not save." });
  }
  return (
    <div className="space-y-4">
      {list.map((a, i) => (
        <div key={i} className={cn(card, "space-y-3 p-4 sm:p-5")}>
          <div className="flex items-center gap-2">
            <Tags className="size-4 shrink-0 text-muted" />
            <input value={a.name} onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Attribute name, e.g. Size" className={cn(input, "py-2 font-semibold")} />
            <button onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Delete attribute" className="grid size-10 shrink-0 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 className="size-4" /></button>
          </div>
          <ValuesEditor attr={a} onChange={(n) => setList(list.map((x, j) => (j === i ? n : x)))} />
          <p className="text-xs text-muted">{a.values.length} value{a.values.length === 1 ? "" : "s"}{isColourOption(a.name) ? " · tap a circle to set the exact colour" : ""}</p>
        </div>
      ))}
      <div className={cn(card, "p-4")}>
        <button onClick={() => setList([...list, { name: "", values: [] }])} className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"><Plus className="size-4" /> New attribute</button>
        {missing.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">Quick add:</span>
            {missing.map((p) => <button key={p.name} onClick={() => setList([...list, { ...p, values: [...p.values] }])} className="rounded-full bg-foreground/5 px-3 py-1.5 font-semibold hover:bg-foreground/10">+ {p.name}</button>)}
          </div>
        )}
      </div>
      <div className="sticky bottom-20 z-20 sm:bottom-4">
        {msg && <p className={cn("mb-2 rounded-2xl px-4 py-2.5 text-sm font-medium", msg.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>{msg.t}</p>}
        <button onClick={save} disabled={busy} className={cn(btnDark, "w-full py-3.5 shadow-xl")}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Save attributes"}</button>
      </div>
    </div>
  );
}
