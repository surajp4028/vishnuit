// Coded, on-brand product visuals for categories that have no real screenshot (SEO & Digital Marketing).
import { cn } from "@/lib/utils";

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative size-full min-w-0 overflow-hidden bg-gradient-to-br from-[#f7f9ff] to-white p-4 text-[#0a0f1f] sm:p-6", className)}>
      <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.18),transparent)]" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-[radial-gradient(closest-side,rgba(212,160,23,0.16),transparent)]" />
      <div className="relative flex h-full flex-col gap-3">{children}</div>
    </div>
  );
}

const card = "rounded-xl border border-[#e6eaf3] bg-white shadow-[0_6px_20px_-12px_rgba(10,15,31,0.25)]";

/* ---------------- SEO ---------------- */
export function SeoVisual({ variant = "default" }: { variant?: "default" | "technical" | "links" }) {
  const bars = [18, 22, 20, 28, 31, 36, 42, 47, 55, 61, 70, 82];
  return (
    <Frame>
      {/* Search bar */}
      <div className={cn(card, "flex items-center gap-2 px-3 py-2")}>
        <span className="text-sm font-bold"><span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span></span>
        <div className="flex-1 truncate rounded-full bg-[#f1f3f8] px-3 py-1 text-[11px] text-[#5b6475]">best digital marketing agency in delhi</div>
      </div>
      {/* Results */}
      <div className={cn(card, "space-y-2.5 p-3")}>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 rounded-md bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] px-1.5 py-0.5 text-[10px] font-bold text-white">#1</span>
          <div className="min-w-0">
            <p className="truncate text-[10px] text-[#188038]">vishnuit.co.in › services</p>
            <p className="truncate text-[13px] font-semibold text-[#1a0dab]">Vishnu IT Solutions — Web, SEO & Marketing Agency</p>
            <p className="flex items-center gap-1 text-[10px] text-[#5b6475]"><span className="text-[#f5b301]">★★★★★</span> 4.9 · 150+ reviews</p>
          </div>
        </div>
        {[2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2 opacity-50">
            <span className="rounded-md bg-[#eef1f7] px-1.5 py-0.5 text-[10px] font-bold text-[#5b6475]">#{n}</span>
            <div className="h-2 flex-1 rounded-full bg-[#e6eaf3]" />
          </div>
        ))}
      </div>
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-5 gap-2 sm:gap-3">
        {/* Traffic chart */}
        <div className={cn(card, "col-span-3 flex min-w-0 flex-col p-2.5 sm:p-3")}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold">Organic traffic</p>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">+312%</span>
          </div>
          <div className="mt-2 flex flex-1 items-end gap-1">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#1d4ed8] to-[#60a5fa]" style={{ height: `${h}%`, opacity: 0.35 + i * 0.055 }} />
            ))}
          </div>
        </div>
        {/* Vitals / links */}
        <div className={cn(card, "col-span-2 flex min-w-0 flex-col justify-between gap-2 p-2.5 sm:p-3")}>
          {(variant === "links"
            ? [["Backlinks", "1,284", 86], ["Ref. domains", "312", 72], ["Authority", "48", 48]]
            : [["LCP", "1.2s", 92], ["INP", "86ms", 95], ["CLS", "0.02", 98]]
          ).map(([k, v, w]) => (
            <div key={k as string}>
              <div className="flex justify-between text-[10px]"><span className="text-[#5b6475]">{k}</span><span className="font-bold text-emerald-600">{v}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-[#eef1f7]"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${w}%` }} /></div>
            </div>
          ))}
          <div className="rounded-lg bg-[#0a0f1f] px-2 py-1.5 text-center text-[10px] font-semibold text-white">
            {variant === "technical" ? "Core Web Vitals: Passed ✓" : variant === "links" ? "Domain authority ↑ 2x" : "Keywords in top 3: 47"}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- Digital marketing ---------------- */
export function MarketingVisual({ variant = "default" }: { variant?: "default" | "social" | "google" | "meta" }) {
  const points = [30, 38, 34, 46, 52, 49, 61, 66, 72, 70, 81, 92];
  const path = points.map((p, i) => `${(i / (points.length - 1)) * 100},${100 - p}`).join(" ");
  const campaigns =
    variant === "social"
      ? [["Instagram Reels", "182K reach", "+46%"], ["Carousel series", "9.4% eng.", "+28%"], ["Story ads", "1,120 clicks", "+19%"]]
      : variant === "google"
        ? [["Search — Brand", "₹62 CPL", "+38%"], ["Search — Services", "₹118 CPL", "+24%"], ["Performance Max", "4.1x ROAS", "+31%"]]
        : [["Lead Gen — Delhi", "₹74 CPL", "+41%"], ["Retargeting", "5.2x ROAS", "+33%"], ["Lookalike 1%", "₹96 CPL", "+22%"]];
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-2.5">
        {(variant === "social" ? [["Followers", "+12.4K"], ["Engagement", "8.7%"], ["Reach", "1.2M"]] : [["ROAS", "3.8x"], ["Leads", "1,248"], ["CPL", "₹86"]]).map(([k, v], i) => (
          <div key={k} className={cn(card, "p-2.5")}>
            <p className="text-[10px] text-[#5b6475]">{k}</p>
            <p className={cn("font-display text-lg font-extrabold sm:text-xl", i === 0 ? "text-[#1d4ed8]" : i === 1 ? "text-[#0a0f1f]" : "text-[#b8860b]")}>{v}</p>
          </div>
        ))}
      </div>
      <div className={cn(card, "flex min-h-0 flex-1 flex-col p-3")}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold">{variant === "social" ? "Audience growth" : "Conversions — last 90 days"}</p>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">▲ 2.6x</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-0 min-h-0 w-full flex-1">
          <defs>
            <linearGradient id="mk-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${path} 100,100`} fill="url(#mk-fill)" />
          <polyline points={path} fill="none" stroke="#1d4ed8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className={cn(card, "divide-y divide-[#eef1f7]")}>
        {campaigns.map(([n, m, d]) => (
          <div key={n} className="flex items-center gap-2 px-3 py-2 text-[11px]">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="flex-1 truncate font-medium">{n}</span>
            <span className="text-[#5b6475]">{m}</span>
            <span className="w-10 text-right font-bold text-emerald-600">{d}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Returns a coded visual for a category / service, or null when a real screenshot should be used. */
export function CategoryVisual({ category, slug }: { category: string; slug?: string }) {
  if (category === "SEO") return <SeoVisual variant={slug === "technical-seo" ? "technical" : slug === "off-page-seo" ? "links" : "default"} />;
  if (category === "Digital Marketing")
    return <MarketingVisual variant={slug === "social-media-marketing" ? "social" : slug === "google-ads-marketing" ? "google" : slug === "meta-ads-marketing" ? "meta" : "default"} />;
  return null;
}

export const hasVisual = (category: string) => category === "SEO" || category === "Digital Marketing";
