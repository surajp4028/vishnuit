"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, ChevronDown, Clock, Copy, ExternalLink, Globe, Loader2, Lock, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, btnDark, btnLight, card, input } from "@/components/store/ui";

type Rec = { type: string; name: string; value: string; note?: string };
type Status = { state: "live" | "dns" | "verify" | "platform"; verification: { type: string; domain: string; value: string }[]; message: string };
type Info = { domain: string | null; records?: Rec[]; status?: Status };

const STATE = {
  live: { label: "Connected", icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  dns: { label: "Waiting for DNS", icon: Clock, cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  verify: { label: "Verify ownership", icon: ShieldCheck, cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  platform: { label: "Almost done", icon: Clock, cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
} as const;

const PROVIDERS = [
  ["GoDaddy", "My Products → your domain → DNS → Add New Record."],
  ["Hostinger", "Domains → your domain → DNS / Nameservers → Manage DNS records."],
  ["BigRock / ResellerClub", "Manage Domain → DNS Management → Manage DNS → A / CNAME tab."],
  ["Namecheap", "Domain List → Manage → Advanced DNS → Add New Record."],
  ["Cloudflare", "DNS → Records → Add record. Keep the cloud icon grey (DNS only), not orange."],
  ["Google / Squarespace Domains", "Domains → your domain → DNS → Custom records."],
] as const;

/**
 * Connect / check / remove a store's own domain.
 * Used on Seller → Domain, and (compact, with the admin endpoint) in Admin → Stores → Manage.
 */
export function DomainManager({ handle, initial, paid, endpoint = "/api/store/domain", compact = false }: { handle: string; initial: string | null; paid: boolean; endpoint?: string; compact?: boolean }) {
  const [info, setInfo] = useState<Info>({ domain: initial });
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "check" | "remove">(initial ? "check" : "");
  const [err, setErr] = useState("");

  const check = useCallback(async () => {
    setBusy("check");
    const r = await api<Info>(endpoint, "GET");
    setBusy("");
    if (r.ok) setInfo(r.data);
  }, [endpoint]);
  useEffect(() => { if (initial) check(); }, [initial, check]);
  // Already browsing the dashboard on the store's own domain? Then there's nothing to jump to.
  const [here, setHere] = useState("");
  useEffect(() => setHere(window.location.hostname.replace(/^www\./, "")), []);

  async function connect() {
    setErr(""); setBusy("save");
    const r = await api<Info>(endpoint, "POST", { domain: value });
    setBusy("");
    if (r.ok) { setInfo(r.data); setValue(""); } else setErr(r.data.error || "Could not connect the domain");
  }
  async function remove() {
    if (!confirm(`Disconnect ${info.domain}? Your store stays open at vishnuit.co.in/catalog/@${handle}.`)) return;
    setBusy("remove");
    const r = await api(endpoint, "DELETE");
    setBusy("");
    if (r.ok) setInfo({ domain: null });
  }

  const st = info.status ? STATE[info.status.state] : null;

  return (
    <div className={cn("grid gap-5", !compact && "lg:grid-cols-[1fr_340px]")}>
      <div className="min-w-0 space-y-5">
        {!info.domain ? (
          <div className={cn(card, "p-5 sm:p-6")}>
            <p className="font-display text-lg font-bold">Connect a domain you own</p>
            <p className="mt-1 text-sm text-muted">Type the address you bought, e.g. <b className="text-foreground">pandeyfashion.com</b> or <b className="text-foreground">shop.pandeyfashion.com</b>.</p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && paid && connect()} disabled={!paid} placeholder="yourbrand.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={cn(input, "pl-11")} />
              </div>
              <button onClick={connect} disabled={!paid || busy === "save" || value.trim().length < 4} className={cn(btnDark, "sm:px-7")}>{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : "Connect"}</button>
            </div>
            {err && <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-600">{err}</p>}
            {!paid && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                <Lock className="size-4 shrink-0" /><span className="flex-1">Custom domains are available on paid plans.</span>
                <Link href="/seller/billing" className="rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-background">Upgrade</Link>
              </div>
            )}
            <p className="mt-4 text-xs text-muted">Don&apos;t have a domain yet? Buy one from GoDaddy, Hostinger, BigRock or Namecheap (about ₹500–1,000 a year), then come back here.</p>
          </div>
        ) : (
          <>
            <div className={cn(card, "p-5 sm:p-6")}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-foreground/5"><Globe className="size-5" /></span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-display text-lg font-bold break-all">{info.domain}</p>
                  {st ? <span className={cn("mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold", st.cls)}><st.icon className="size-3.5" />{st.label}</span> : <span className="text-xs text-muted">Checking…</span>}
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  {info.status?.state === "live" && <a href={`https://${info.domain}`} target="_blank" rel="noopener" className={cn(btnLight, "flex-1 px-4 py-2 sm:flex-none")}><ExternalLink className="size-4" />Open</a>}
                  <button onClick={check} disabled={busy !== ""} className={cn(btnLight, "flex-1 px-4 py-2 sm:flex-none")}>{busy === "check" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Check now</button>
                </div>
              </div>
              {info.status && <p className="mt-4 text-sm text-muted">{info.status.message}</p>}
            </div>

            {info.status?.state === "live" && !compact && here !== info.domain?.replace(/^www\./, "") && (
              <div className={cn(card, "flex flex-col gap-4 bg-gradient-to-br from-emerald-500/[.07] to-transparent p-5 sm:flex-row sm:items-center sm:p-6")}>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600"><Lock className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold">Use your dashboard on {info.domain}</p>
                  <p className="text-sm text-muted">Manage everything at <b className="text-foreground">{info.domain}/seller</b> — you&apos;ll be signed in automatically. Plan payments still open on vishnuit.co.in.</p>
                </div>
                <a href="/api/account/jump?to=store&next=/seller" className={cn(btnDark, "shrink-0 px-6")}>Log in on {info.domain} →</a>
              </div>
            )}

            {info.status?.state !== "live" && info.records && (
              <div className={cn(card, "p-5 sm:p-6")}>
                <p className="font-display text-lg font-bold">Add {info.records.length + (info.status?.verification.length ?? 0) === 1 ? "this record" : "these records"} at your domain provider</p>
                <p className="mt-1 text-sm text-muted">Log in where you bought the domain, open its DNS settings, and add:</p>
                <div className="mt-4 space-y-2.5">
                  {[...info.records, ...(info.status?.verification ?? []).map((v) => ({ type: v.type, name: v.domain.replace(`.${info.domain}`, ""), value: v.value, note: "Proves the domain is yours" }))].map((r) => <RecordRow key={r.type + r.name + r.value} r={r} />)}
                </div>
                <ul className="mt-4 space-y-1.5 text-xs text-muted">
                  <li>• If an old <b>A</b> record for <b>@</b> (or a CNAME for <b>www</b>) already exists, edit it instead of adding a second one.</li>
                  <li>• TTL: leave the default (or 1 hour).</li>
                  <li>• DNS updates usually take 5–30 minutes, sometimes up to 24 hours. Then tap “Check now”.</li>
                </ul>
                <details className="group mt-4 rounded-2xl border border-border [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">Where is DNS on my provider?<ChevronDown className="size-4 transition group-open:rotate-180" /></summary>
                  <div className="space-y-2 border-t border-border px-4 py-3 text-sm">
                    {PROVIDERS.map(([n, t]) => <p key={n}><b>{n}:</b> <span className="text-muted">{t}</span></p>)}
                  </div>
                </details>
              </div>
            )}

            <button onClick={remove} disabled={busy !== ""} className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline">{busy === "remove" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Disconnect domain</button>
          </>
        )}
      </div>

      {!compact && <aside className={cn(card, "h-fit p-5 sm:p-6")}>
        <p className="font-display font-bold">How it works</p>
        <ol className="mt-4 space-y-4">
          {[
            ["Buy a domain", "From any provider — GoDaddy, Hostinger, BigRock, Namecheap…"],
            ["Connect it here", "Type it above. We register it on our servers."],
            ["Point the DNS", "Add the 1–2 records we show at your provider. This tells the internet your domain lives with us."],
            ["You're live", "We turn on https (SSL) automatically. Your store opens at your domain."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background">{i + 1}</span>
              <span><b className="block text-sm">{t}</b><span className="text-xs text-muted">{d}</span></span>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-2xl bg-foreground/[.04] px-4 py-3 text-xs text-muted">Your old link <b className="break-all text-foreground">vishnuit.co.in/catalog/@{handle}</b> keeps working too. Products, orders and settings stay the same.</p>
      </aside>}
    </div>
  );
}

function RecordRow({ r }: { r: Rec }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-1.5 rounded-2xl border border-border p-3.5 text-sm sm:grid-cols-[64px_120px_1fr]">
      <Cell label="Type" value={r.type} />
      <Cell label="Name / Host" value={r.name} copy />
      <Cell label="Value / Points to" value={r.value} copy className="col-span-2 sm:col-span-1" />
      {r.note && <p className="col-span-2 text-xs text-muted sm:col-span-3">{r.note}</p>}
    </div>
  );
}

function Cell({ label, value, copy, className }: { label: string; value: string; copy?: boolean; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <code className="truncate font-mono text-[13px] font-semibold">{value}</code>
        {copy && (
          <button type="button" aria-label={`Copy ${label}`} onClick={() => { navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1200); }); }} className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground">
            {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
