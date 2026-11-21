"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";

/** Your store's addresses: the connected domain (if any) and the always-on vishnuit.co.in link. */
export function StoreLinkCard({ handle, name, domain }: { handle: string; name: string; domain?: string | null }) {
  const free = `https://www.vishnuit.co.in/catalog/@${handle}`;
  const links = [...(domain ? [{ url: `https://${domain}`, label: domain, tag: "Your domain" }] : []), { url: free, label: `vishnuit.co.in/catalog/@${handle}`, tag: domain ? "Free link" : "" }];
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] bg-[#0a0f1f] p-5 text-white md:p-7">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,.45),transparent)]" />
      <p className="relative text-xs font-bold tracking-[3px] text-white/55">YOUR STORE {links.length > 1 ? "LINKS" : "LINK"}</p>
      <div className="relative mt-3 space-y-3">
        {links.map((l, i) => <LinkRow key={l.url} {...l} name={name} big={i === 0} />)}
      </div>
      {!domain && <a href="/seller/domain" className="relative mt-4 inline-block text-sm font-semibold text-[#f5c542] hover:underline">+ Use your own domain (yourbrand.com)</a>}
    </div>
  );
}

function LinkRow({ url, label, tag, name, big }: { url: string; label: string; tag: string; name: string; big: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }
  async function share() { try { if (navigator.share) await navigator.share({ title: name, url }); else await copy(); } catch {} }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3.5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        {tag && <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${tag === "Your domain" ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/60"}`}>{tag.toUpperCase()}</span>}
        <p className={`font-display font-bold break-all ${big ? "text-lg md:text-2xl" : "text-[15px] text-white/85"}`}>{label}</p>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-2">
        <button onClick={share} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-black"><Share2 className="size-4" /> Share</button>
        <button onClick={copy} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-3.5 py-2 text-[13px] font-semibold">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}</button>
        <a href={url} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-3.5 py-2 text-[13px] font-semibold"><ExternalLink className="size-4" /> Open</a>
      </div>
    </div>
  );
}
