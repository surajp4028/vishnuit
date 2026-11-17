"use client";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Inbox, Megaphone, Save } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export type LpRow = {
  slug: string; title: string; headline: string;
  leads: { total: number; d7: number; today: number; last: string | null };
  pixelId: string; hasToken: boolean;
};

const inputCls = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";

export function LandingPagesManager({ rows, commonPixel, commonHasToken }: { rows: LpRow[]; commonPixel: string; commonHasToken: boolean }) {
  const total = rows.reduce((n, r) => n + r.leads.total, 0);
  const d7 = rows.reduce((n, r) => n + r.leads.d7, 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Landing Pages</h1>
        <p className="mt-1 text-sm text-muted">Ad landing pages on your site, their leads and the Meta Pixel each one uses.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[["Landing pages", rows.length], ["LP leads (all time)", total], ["LP leads (7 days)", d7]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted">{l}</p>
            <p className="mt-1 font-display text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 text-sm">
        <p className="font-semibold">Common Meta Pixel</p>
        <p className="mt-1 text-muted">
          {commonPixel ? <>All pages use <b className="font-mono text-foreground">{commonPixel}</b>{commonHasToken ? " with Conversions API" : " (no Conversions API token yet)"}.</> : "Not set yet."}{" "}
          Set it in <Link href="/admin/settings" className="text-accent underline">Settings → Integrations</Link>. Give a landing page its own pixel below only if its ads run from a different ad account or business.
        </p>
      </div>

      <div className="grid gap-5">
        {rows.map((r) => <LpCard key={r.slug} row={r} commonPixel={commonPixel} />)}
      </div>

      <p className="text-xs text-muted">Need another landing page (e.g. for app development or SEO)? Ask your developer to add it — it shows up here automatically with its own leads and pixel.</p>
    </div>
  );
}

function LpCard({ row, commonPixel }: { row: LpRow; commonPixel: string }) {
  const [pixelId, setPixelId] = useState(row.pixelId);
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState({ pixelId: row.pixelId, hasToken: row.hasToken });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/landing-pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: row.slug, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, t: j.error || "Could not save" });
    setSaved({ pixelId: j.pixelId, hasToken: j.hasToken }); setPixelId(j.pixelId); setToken("");
    setMsg({ ok: true, t: j.pixelId ? "Saved — this page now uses its own pixel." : "Saved — this page uses the common pixel." });
  }

  const active = saved.pixelId || commonPixel;
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent"><Megaphone className="size-3.5" /> /{row.slug}</div>
          <h2 className="mt-1 font-display text-lg font-bold">{row.headline}</h2>
          <p className="mt-0.5 truncate text-xs text-muted">{row.title}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/leads?q=lp:${row.slug}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-foreground/5"><Inbox className="size-3.5" /> Leads</Link>
          <a href={`/${row.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white"><ExternalLink className="size-3.5" /> Open page</a>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Today", row.leads.today], ["Last 7 days", row.leads.d7], ["All time", row.leads.total], ["Last lead", row.leads.last ? formatDate(row.leads.last) : "—"]].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-foreground/[0.03] p-3">
            <p className="text-[11px] font-medium text-muted">{l}</p>
            <p className="mt-0.5 font-display text-lg font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Meta Pixel</p>
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", saved.pixelId ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-emerald-500/10 text-emerald-600")}>
            {saved.pixelId ? "Own pixel" : "Common pixel"}{active ? ` · ${active}` : " · not set"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Own Pixel ID (optional)</span>
            <input value={pixelId} onChange={(e) => setPixelId(e.target.value)} inputMode="numeric" placeholder={commonPixel ? `Empty = common (${commonPixel})` : "e.g. 123456789012345"} className={inputCls} />
            <span className="mt-1 block text-[11px] text-muted">Only the number from Events Manager, not the full script.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Conversions API token for this pixel (optional)</span>
            <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder={saved.hasToken ? "•••••••• saved — type to replace" : "EAAG…"} disabled={!pixelId} className={cn(inputCls, !pixelId && "opacity-50")} />
            <span className="mt-1 block text-[11px] text-muted">{saved.hasToken ? "Token saved. " : ""}Needed only with an own pixel.</span>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button disabled={busy} onClick={() => save({ pixelId, capiToken: token })} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save className="size-4" /> {busy ? "Saving…" : "Save"}</button>
          {saved.pixelId && <button disabled={busy} onClick={() => save({ pixelId: "", clearToken: true })} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-foreground/5">Use common pixel</button>}
          {msg && <span className={cn("text-xs font-medium", msg.ok ? "text-emerald-600" : "text-red-500")}>{msg.t}</span>}
        </div>
      </div>
    </section>
  );
}
