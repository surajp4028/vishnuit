"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";

export function StoreLinkCard({ handle, name }: { handle: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/catalog/@${handle}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }
  async function share() {
    try { if (navigator.share) await navigator.share({ title: name, url: url() }); else await copy(); } catch {}
  }
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] bg-[#0a0f1f] p-5 text-white md:p-7">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,.45),transparent)]" />
      <p className="relative text-xs font-bold tracking-[3px] text-white/55">YOUR STORE LINK</p>
      <p className="relative mt-2 font-display text-lg font-bold break-all md:text-2xl">vishnuit.co.in/catalog/@{handle}</p>
      <div className="relative mt-5 grid grid-cols-3 gap-2 sm:flex">
        <button onClick={share} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black"><Share2 className="size-4" /> Share</button>
        <button onClick={copy} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}</button>
        <a href={`/catalog/@${handle}`} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold"><ExternalLink className="size-4" /> Open</a>
      </div>
    </div>
  );
}
