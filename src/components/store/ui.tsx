"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const input = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-foreground/40 focus:ring-4 focus:ring-foreground/5";
export const card = "rounded-[1.6rem] border border-border bg-card";
export const btnDark = "inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition active:scale-[.98] disabled:opacity-50";
export const btnLight = "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50";

export async function api<T = Record<string, unknown>>(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string; code?: string };
  return { ok: r.ok, data: j };
}

export async function uploadImage(file: File, kind: "product" | "logo" | "banner" | "qr") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  const r = await fetch("/api/store/upload", { method: "POST", body: fd });
  const j = (await r.json().catch(() => ({}))) as { key?: string; url?: string; error?: string };
  if (!r.ok || !j.key) throw new Error(j.error || "Upload failed");
  return { key: j.key, url: j.url! };
}
export const imgUrl = (key: string | null | undefined) => (key ? `/api/catalog/img?k=${encodeURIComponent(key)}` : null);

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Toggle({ on, onChange, label, sub, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!on)} className={cn("flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3.5 text-left", disabled && "opacity-50")}>
      <span>
        <span className="block text-[15px] font-semibold">{label}</span>
        {sub && <span className="mt-0.5 block text-xs text-muted">{sub}</span>}
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition", on ? "bg-foreground" : "bg-foreground/15")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-background shadow transition-all", on ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

/** Single image picker (logo, banner, QR). */
export function ImagePick({ value, onChange, kind, label, aspect = "aspect-square" }: { value: string | null; onChange: (key: string | null) => void; kind: "logo" | "banner" | "qr"; label: string; aspect?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const url = imgUrl(value);
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <button type="button" onClick={() => ref.current?.click()} className={cn("relative grid w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-background", aspect)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="absolute inset-0 size-full object-contain p-2" /> : <span className="flex flex-col items-center gap-1.5 text-xs text-muted">{busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}Tap to upload</span>}
        {busy && url && <span className="absolute inset-0 grid place-items-center bg-background/70"><Loader2 className="size-5 animate-spin" /></span>}
      </button>
      {value && <button type="button" onClick={() => onChange(null)} className="mt-1.5 text-xs font-medium text-red-500">Remove</button>}
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = "";
        if (!f) return;
        setBusy(true); setErr("");
        try { onChange((await uploadImage(f, kind)).key); } catch (x) { setErr((x as Error).message); }
        setBusy(false);
      }} />
    </div>
  );
}

/** Product gallery: up to 10 photos, reorder by tapping "Make cover". */
export function Gallery({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {value.map((k, i) => (
          <div key={k} className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(k)!} alt="" className="size-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} aria-label="Remove photo" className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white"><X className="size-3.5" /></button>
            {i === 0 ? (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">COVER</span>
            ) : (
              <button type="button" onClick={() => onChange([k, ...value.filter((x) => x !== k)])} className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-black">Make cover</button>
            )}
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => <div key={`b${i}`} className="grid aspect-square place-items-center rounded-2xl border border-border bg-background"><Loader2 className="size-5 animate-spin text-muted" /></div>)}
        {value.length + busy < 10 && (
          <button type="button" onClick={() => ref.current?.click()} className="grid aspect-square place-items-center rounded-2xl border border-dashed border-border bg-background text-muted">
            <span className="flex flex-col items-center gap-1 text-xs"><ImagePlus className="size-5" /> Add photos</span>
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={async (e) => {
        const files = Array.from(e.target.files ?? []).slice(0, 10 - value.length); e.target.value = "";
        if (!files.length) return;
        setErr(""); setBusy(files.length);
        const keys: string[] = [];
        for (const f of files) {
          try { keys.push((await uploadImage(f, "product")).key); } catch (x) { setErr((x as Error).message); }
          setBusy((b) => b - 1);
        }
        onChange([...value, ...keys]);
      }} />
    </div>
  );
}

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
