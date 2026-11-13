"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon, ICON_NAMES } from "@/components/icon";
import type { Field } from "@/lib/collections";

export const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-[var(--ring)]";

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.url;
}

export function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-foreground/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-muted" />}
      </div>
      <div className="flex-1 space-y-2">
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="/media/… or https://…" className={inputCls} />
        <div className="flex gap-2">
          <button type="button" onClick={() => ref.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />} Upload
          </button>
          {value && <button type="button" onClick={() => onChange("")} className="text-xs text-red-500">Remove</button>}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try { onChange(await uploadFile(f)); } catch (err) { alert((err as Error).message); }
            setBusy(false);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function ImagesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const list = value ?? [];
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((src, i) => (
          <div key={src + i} className="group relative aspect-video overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100"><X className="size-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} className="grid aspect-video place-items-center rounded-lg border border-dashed border-border text-muted hover:border-accent hover:text-accent">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          setBusy(true);
          const urls: string[] = [];
          for (const f of files) {
            try { urls.push(await uploadFile(f)); } catch (err) { alert((err as Error).message); }
          }
          onChange([...list, ...urls]);
          setBusy(false);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PairsInput({ value, onChange }: { value: { title: string; text: string }[]; onChange: (v: { title: string; text: string }[]) => void }) {
  const list = value ?? [];
  const set = (i: number, k: "title" | "text", v: string) => onChange(list.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="space-y-2">
      {list.map((p, i) => (
        <div key={i} className="flex gap-2">
          <input value={p.title} onChange={(e) => set(i, "title", e.target.value)} placeholder="Title" className={cn(inputCls, "w-1/3")} />
          <input value={p.text} onChange={(e) => set(i, "text", e.target.value)} placeholder="Description" className={inputCls} />
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="rounded-lg px-2 text-muted hover:text-red-500"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { title: "", text: "" }])} className="inline-flex items-center gap-1 text-xs font-medium text-accent"><Plus className="size-3.5" /> Add highlight</button>
    </div>
  );
}

export function FieldInput({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (f.type) {
    case "textarea":
      return <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} className={inputCls} />;
    case "html":
      return <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} rows={14} className={cn(inputCls, "font-mono text-xs")} />;
    case "number":
      return <input type="number" value={(value as number) ?? 0} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
    case "date":
      return <input type="date" value={String(value ?? "").slice(0, 10)} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
    case "bool":
      return (
        <button type="button" onClick={() => onChange(!value)} className={cn("relative h-6 w-11 rounded-full transition", value ? "bg-accent" : "bg-foreground/15")}>
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", value ? "left-[22px]" : "left-0.5")} />
        </button>
      );
    case "select":
      return (
        <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "icon":
      return (
        <div className="flex flex-wrap gap-1.5">
          {ICON_NAMES.map((n) => (
            <button type="button" key={n} title={n} onClick={() => onChange(n)} className={cn("grid size-9 place-items-center rounded-lg border", value === n ? "border-accent bg-accent text-white" : "border-border text-muted hover:text-foreground")}>
              <Icon name={n} className="size-4" />
            </button>
          ))}
        </div>
      );
    case "list":
      return <textarea value={((value as string[]) ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} rows={5} placeholder="One item per line" className={inputCls} />;
    case "image":
      return <ImageInput value={(value as string) ?? ""} onChange={onChange} />;
    case "images":
      return <ImagesInput value={(value as string[]) ?? []} onChange={onChange} />;
    case "pairs":
      return <PairsInput value={(value as { title: string; text: string }[]) ?? []} onChange={onChange} />;
    default:
      return <input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
  }
}
