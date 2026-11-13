"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageInput, inputCls } from "./fields";

type Obj = Record<string, unknown>;

const TABS: { key: string; label: string; desc: string }[] = [
  { key: "branding", label: "Branding", desc: "Site name, logos and brand colour." },
  { key: "hero", label: "Homepage hero", desc: "Headline, rotating words and buttons." },
  { key: "stats", label: "Stats", desc: "Counters shown on home & about." },
  { key: "contact", label: "Contact", desc: "Email, phone, WhatsApp, address & map." },
  { key: "social", label: "Social links", desc: "Leave empty to hide an icon." },
  { key: "seo", label: "SEO", desc: "Default meta title, description and share image." },
  { key: "founder", label: "Founder", desc: "Founder card on home & about." },
  { key: "conversion", label: "Conversion", desc: "WhatsApp button, lead email alerts and announcement bar." },
  { key: "security", label: "Password", desc: "Change your admin password." },
];

const IMAGE_KEYS = ["logoLight", "logoDark", "favicon", "photo", "ogImage"];
const LONG_KEYS = ["subtitle", "description", "bio", "keywords", "announcement", "mapEmbed"];
const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function ObjectEditor({ value, onChange }: { value: Obj; onChange: (v: Obj) => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {Object.entries(value).map(([k, v]) => {
        const set = (nv: unknown) => onChange({ ...value, [k]: nv });
        const wide = IMAGE_KEYS.includes(k) || LONG_KEYS.includes(k) || Array.isArray(v);
        return (
          <label key={k} className={cn("block", wide && "sm:col-span-2")}>
            <span className="mb-1.5 block text-xs font-medium text-muted">{label(k)}</span>
            {typeof v === "boolean" ? (
              <button type="button" onClick={() => set(!v)} className={cn("relative h-6 w-11 rounded-full transition", v ? "bg-accent" : "bg-foreground/15")}>
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", v ? "left-[22px]" : "left-0.5")} />
              </button>
            ) : Array.isArray(v) ? (
              <textarea value={(v as string[]).join("\n")} onChange={(e) => set(e.target.value.split("\n"))} rows={5} className={inputCls} />
            ) : IMAGE_KEYS.includes(k) ? (
              <ImageInput value={String(v ?? "")} onChange={set} />
            ) : k === "accent" ? (
              <div className="flex gap-2"><input type="color" value={String(v)} onChange={(e) => set(e.target.value)} className="h-10 w-14 rounded-lg border border-border" /><input value={String(v)} onChange={(e) => set(e.target.value)} className={inputCls} /></div>
            ) : LONG_KEYS.includes(k) ? (
              <textarea value={String(v ?? "")} onChange={(e) => set(e.target.value)} rows={3} className={inputCls} />
            ) : (
              <input value={String(v ?? "")} onChange={(e) => set(e.target.value)} className={inputCls} />
            )}
          </label>
        );
      })}
    </div>
  );
}

function StatsEditor({ value, onChange }: { value: { label: string; value: number; suffix: string }[]; onChange: (v: unknown) => void }) {
  const set = (i: number, k: string, v: string) => onChange(value.map((s, j) => (j === i ? { ...s, [k]: k === "value" ? Number(v) : v } : s)));
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input value={s.label} onChange={(e) => set(i, "label", e.target.value)} placeholder="Label" className={inputCls} />
          <input type="number" step="0.1" value={s.value} onChange={(e) => set(i, "value", e.target.value)} className={cn(inputCls, "w-28")} />
          <input value={s.suffix} onChange={(e) => set(i, "suffix", e.target.value)} placeholder="+" className={cn(inputCls, "w-20")} />
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-red-500"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...value, { label: "", value: 0, suffix: "+" }])} className="inline-flex items-center gap-1 text-xs font-medium text-accent"><Plus className="size-3.5" /> Add stat</button>
    </div>
  );
}

function PasswordForm() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="max-w-sm space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        if (fd.next !== fd.confirm) { setMsg("Passwords don't match"); setBusy(false); return; }
        const res = await fetch("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fd) });
        const j = await res.json();
        setMsg(res.ok ? "✓ Password updated" : j.error);
        setBusy(false);
        if (res.ok) (e.target as HTMLFormElement).reset();
      }}
    >
      {[["current", "Current password"], ["next", "New password (min 8)"], ["confirm", "Confirm new password"]].map(([n, l]) => (
        <label key={n} className="block"><span className="mb-1.5 block text-xs font-medium text-muted">{l}</span><input name={n} type="password" required className={inputCls} /></label>
      ))}
      {msg && <p className="text-sm">{msg}</p>}
      <button disabled={busy} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">Update password</button>
    </form>
  );
}

export function SettingsEditor({ initial }: { initial: Obj }) {
  const router = useRouter();
  const [tab, setTab] = useState("branding");
  const [data, setData] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const meta = TABS.find((t) => t.key === tab)!;

  async function save() {
    setState("saving");
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: tab, value: data[tab] }) });
    if (!res.ok) { alert("Save failed"); setState("idle"); return; }
    setState("saved");
    router.refresh();
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Settings & Branding</h1>
        <p className="text-sm text-muted">Control your brand, contact details, SEO and conversion features.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 lg:flex-col">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("shrink-0 rounded-xl px-3 py-2 text-left text-sm font-medium", tab === t.key ? "bg-accent text-white" : "text-muted hover:bg-foreground/5 hover:text-foreground")}>{t.label}</button>
          ))}
        </nav>
        <div className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div><h2 className="font-display text-lg font-bold">{meta.label}</h2><p className="text-sm text-muted">{meta.desc}</p></div>
            {tab !== "security" && (
              <button onClick={save} disabled={state === "saving"} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {state === "saving" ? <Loader2 className="size-4 animate-spin" /> : state === "saved" ? <Check className="size-4" /> : null}
                {state === "saved" ? "Saved" : "Save changes"}
              </button>
            )}
          </div>
          {tab === "security" ? (
            <PasswordForm />
          ) : tab === "stats" ? (
            <StatsEditor value={data.stats as { label: string; value: number; suffix: string }[]} onChange={(v) => setData({ ...data, stats: v })} />
          ) : (
            <ObjectEditor value={data[tab] as Obj} onChange={(v) => setData({ ...data, [tab]: v })} />
          )}
        </div>
      </div>
    </div>
  );
}
