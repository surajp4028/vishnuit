"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Images, Loader2, Trash2, Upload, X } from "lucide-react";
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

/**
 * Upload a product video straight to S3 (signed link from our API), with progress.
 * Big files never pass through our server, so there's no request-size limit problem.
 */
export async function uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<{ key: string; url: string }> {
  const sign = await api<{ key: string; url: string; headers: Record<string, string> }>("/api/store/video", "POST", { type: file.type, size: file.size });
  if (!sign.ok) throw new Error(sign.data.error || "Could not start the upload");
  await new Promise<void>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", sign.data.url);
    for (const [h, v] of Object.entries(sign.data.headers)) x.setRequestHeader(h, v);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error("Upload failed — please try again.")));
    x.onerror = () => reject(new Error("Upload blocked — check your connection (or storage CORS settings)."));
    x.send(file);
  });
  const done = await api<{ key: string; url: string }>("/api/store/video", "PUT", { key: sign.data.key, size: file.size });
  if (!done.ok) throw new Error(done.data.error || "Upload failed");
  onProgress?.(100);
  return done.data;
}

/** Upload one image; onProgress gets 0–100 while the file is sent (then 100 while it's processed). */
export function uploadImage(file: File, kind: "product" | "logo" | "banner" | "qr", onProgress?: (pct: number) => void): Promise<{ key: string; url: string }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const x = new XMLHttpRequest();
    x.open("POST", "/api/store/upload");
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
    x.onload = () => {
      let j: { key?: string; url?: string; error?: string } = {};
      try { j = JSON.parse(x.responseText); } catch {}
      if (x.status >= 200 && x.status < 300 && j.key) { onProgress?.(100); resolve({ key: j.key, url: j.url! }); }
      else reject(new Error(j.error || "Upload failed"));
    };
    x.onerror = () => reject(new Error("Network error — check your connection."));
    x.send(fd);
  });
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
type Media = { key: string; url: string; kind: string; width: number | null; height: number | null };

/** Media library: pick one or many photos already uploaded to this store (and upload more). */
export function MediaPicker({ open, onClose, onPick, multiple = true, kind = "product" }: { open: boolean; onClose: () => void; onPick: (keys: string[]) => void; multiple?: boolean; kind?: "product" | "logo" | "banner" | "qr" }) {
  const [items, setItems] = useState<Media[] | null>(null);
  const [all, setAll] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [ups, setUps] = useState<{ id: string; name: string; pct: number }[]>([]);
  const [err, setErr] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [deleting, setDeleting] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setSel([]); setItems(null);
    fetch(`/api/store/media${all ? "" : `?kind=${kind}`}`).then((r) => r.json()).then((j) => { setItems(j.items ?? []); if (j.usage) setUsage(j.usage); }).catch(() => setItems([]));
  }, [open, all, kind]);
  async function remove(key: string) {
    if (!confirm("Delete this photo from your library? This frees up storage and can't be undone.")) return;
    setErr(""); setDeleting(key);
    const r = await api<{ usage: Usage }>(`/api/store/media?k=${encodeURIComponent(key)}`, "DELETE");
    setDeleting("");
    if (r.ok) { setItems((it) => (it ?? []).filter((m) => m.key !== key)); setSel((s) => s.filter((k) => k !== key)); setUsage((u) => (u ? { ...u, ...r.data.usage } : u)); }
    else setErr(r.data.error || "Could not delete");
  }
  if (!open) return null;
  const toggle = (k: string) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : multiple ? [...s, k] : [k]));
  async function upload(files: File[]) {
    setErr("");
    for (const f of files) {
      const id = Math.random().toString(36).slice(2);
      setUps((u) => [...u, { id, name: f.name, pct: 0 }]);
      try {
        const r = await uploadImage(f, kind, (pct) => setUps((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))));
        setItems((it) => [{ key: r.key, url: r.url, kind, width: null, height: null }, ...(it ?? [])]);
        setSel((s) => (multiple ? [...s, r.key] : [r.key]));
      } catch (e) { setErr((e as Error).message); }
      setUps((u) => u.filter((x) => x.id !== id));
    }
  }
  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-background sm:items-center sm:justify-center sm:bg-black/50 sm:p-6" onClick={onClose}>
      <div className="flex h-full w-full flex-col bg-background sm:h-[85dvh] sm:max-w-3xl sm:rounded-[2rem] sm:border sm:border-border" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-foreground/5"><X className="size-5" /></button>
          <div className="flex-1"><p className="font-display text-lg font-bold">Media library</p><p className="text-xs text-muted">Choose photos you&apos;ve uploaded before, or upload new ones.</p></div>
          <button onClick={() => ref.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold"><Upload className="size-4" /> Upload</button>
        </header>
        {usage && <StorageBar usage={usage} className="border-b border-border px-4 py-2.5" />}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs">
          <button onClick={() => setAll(false)} className={cn("rounded-full px-3 py-1.5 font-semibold", !all ? "bg-foreground text-background" : "text-muted")}>{kind === "product" ? "Product photos" : "This type"}</button>
          <button onClick={() => setAll(true)} className={cn("rounded-full px-3 py-1.5 font-semibold", all ? "bg-foreground text-background" : "text-muted")}>All media</button>
          {err && <span className="ml-auto text-red-500">{err}</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {ups.map((u) => (
              <div key={u.id} className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border border-border bg-foreground/[.03]">
                <ProgressRing pct={u.pct} />
              </div>
            ))}
            {items?.map((m) => {
              const on = sel.includes(m.key);
              return (
                <div key={m.key} className="group relative">
                  <button onClick={() => toggle(m.key)} className={cn("relative block aspect-square w-full overflow-hidden rounded-xl bg-foreground/5 ring-offset-2 ring-offset-background transition", on ? "ring-2 ring-foreground" : "hover:opacity-90", deleting === m.key && "opacity-40")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" loading="lazy" className="size-full object-cover" />
                    {on && <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">{multiple ? sel.indexOf(m.key) + 1 : "✓"}</span>}
                  </button>
                  <button onClick={() => remove(m.key)} disabled={!!deleting} aria-label="Delete photo" title="Delete to free storage" className="absolute top-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100">
                    {deleting === m.key ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
          {items === null && <p className="py-10 text-center text-sm text-muted"><Loader2 className="mx-auto size-5 animate-spin" /></p>}
          {items?.length === 0 && !ups.length && <p className="py-14 text-center text-sm text-muted">No photos yet — tap Upload to add some.</p>}
        </div>
        <footer className="flex items-center gap-3 border-t border-border p-3">
          <p className="flex-1 text-sm text-muted">{sel.length ? `${sel.length} selected` : "Tap photos to select"}</p>
          <button disabled={!sel.length} onClick={() => { onPick(sel); onClose(); }} className={cn(btnDark, "py-2.5")}>Use {sel.length > 1 ? `${sel.length} photos` : "photo"}</button>
        </footer>
        <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => { const fs = Array.from(e.target.files ?? []); e.target.value = ""; if (fs.length) upload(fs); }} />
      </div>
    </div>
  );
}

type Usage = { used: number; limit: number; files: number; label: string };

/** "120 MB of 1 GB" bar — amber from 80%, red when full. */
export function StorageBar({ usage, className }: { usage: Usage; className?: string }) {
  const pct = Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100));
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs"><span className="font-semibold">Storage</span><span className={cn(pct >= 100 ? "font-bold text-red-600" : pct >= 80 ? "font-semibold text-amber-700" : "text-muted")}>{usage.label} used{pct >= 100 ? " · full" : ""}</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10"><div className={cn("h-full rounded-full", pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.max(pct, usage.used ? 2 : 0)}%` }} /></div>
    </div>
  );
}

/** Circular upload progress with the % in the middle. */
export function ProgressRing({ pct }: { pct: number }) {
  const r = 18, c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-14 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90"><circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="4" /><circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} className="transition-[stroke-dashoffset] duration-200" /></svg>
      <span className="text-[11px] font-bold">{pct >= 100 ? <Loader2 className="size-4 animate-spin" /> : `${pct}%`}</span>
    </span>
  );
}

export function ImagePick({ value, onChange, kind, label, aspect = "aspect-square" }: { value: string | null; onChange: (key: string | null) => void; kind: "logo" | "banner" | "qr"; label: string; aspect?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [lib, setLib] = useState(false);
  const url = imgUrl(value);
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <button type="button" onClick={() => ref.current?.click()} className={cn("relative grid w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-background", aspect)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="absolute inset-0 size-full object-contain p-2" /> : pct == null && <span className="flex flex-col items-center gap-1.5 text-xs text-muted"><ImagePlus className="size-5" />Tap to upload</span>}
        {pct != null && <span className="absolute inset-0 grid place-items-center bg-background/80"><ProgressRing pct={pct} /></span>}
      </button>
      <div className="mt-1.5 flex items-center gap-3 text-xs font-medium">
        <button type="button" onClick={() => setLib(true)} className="text-accent">Choose from library</button>
        {value && <button type="button" onClick={() => onChange(null)} className="text-red-500">Remove</button>}
      </div>
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = "";
        if (!f) return;
        setPct(0); setErr("");
        try { onChange((await uploadImage(f, kind, setPct)).key); } catch (x) { setErr((x as Error).message); }
        setPct(null);
      }} />
      <MediaPicker open={lib} onClose={() => setLib(false)} kind={kind} multiple={false} onPick={(k) => k[0] && onChange(k[0])} />
    </div>
  );
}

/** Product photos: upload with live % per photo, or pick from the media library. First photo = cover. */
export function Gallery({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [ups, setUps] = useState<{ id: string; pct: number; preview: string }[]>([]);
  const [err, setErr] = useState("");
  const [lib, setLib] = useState(false);
  const room = 10 - value.length - ups.length;
  async function upload(files: File[]) {
    setErr("");
    const added: string[] = [];
    await Promise.all(files.slice(0, room).map(async (f) => {
      const id = Math.random().toString(36).slice(2);
      setUps((u) => [...u, { id, pct: 0, preview: URL.createObjectURL(f) }]);
      try { added.push((await uploadImage(f, "product", (pct) => setUps((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))))).key); }
      catch (x) { setErr((x as Error).message); }
      setUps((u) => u.filter((x) => x.id !== id));
    }));
    onChange([...value, ...added]);
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><span className="text-[13px] font-semibold">Photos <span className="font-normal text-muted">· {value.length}/10 · first one is the cover</span></span></div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {value.map((k, i) => (
          <div key={k} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
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
        {ups.map((u) => (
          <div key={u.id} className="relative aspect-square overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.preview} alt="" className="size-full object-cover opacity-40 blur-[1px]" />
            <span className="absolute inset-0 grid place-items-center"><ProgressRing pct={u.pct} /></span>
          </div>
        ))}
        {room > 0 && (
          <>
            <button type="button" onClick={() => ref.current?.click()} className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border bg-background text-muted transition hover:border-foreground/40 hover:text-foreground">
              <span className="flex flex-col items-center gap-1 text-xs font-semibold"><Upload className="size-5" /> Upload</span>
            </button>
            <button type="button" onClick={() => setLib(true)} className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border bg-background text-muted transition hover:border-foreground/40 hover:text-foreground">
              <span className="flex flex-col items-center gap-1 text-xs font-semibold"><Images className="size-5" /> Library</span>
            </button>
          </>
        )}
      </div>
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => { const fs = Array.from(e.target.files ?? []); e.target.value = ""; if (fs.length) upload(fs); }} />
      <MediaPicker open={lib} onClose={() => setLib(false)} onPick={(keys) => onChange([...value, ...keys.filter((k) => !value.includes(k))].slice(0, 10))} />
    </div>
  );
}

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
