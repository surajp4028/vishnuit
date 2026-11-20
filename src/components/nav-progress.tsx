"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Site-wide page-change loader: a slim bar with a glowing comet head that trickles while the next
 * page loads, then completes and fades. Starts on any internal link click.
 */
export function NavProgress() {
  const path = usePathname();
  const sp = useSearchParams();
  const [p, setP] = useState(0); // 0 = hidden, 0..100 progress
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const store = path?.startsWith("/catalog/");

  const start = () => {
    if (timer.current) return;
    setDone(false);
    setP(8);
    timer.current = setInterval(() => setP((x) => (x < 85 ? x + (90 - x) * 0.08 : x)), 160);
    setTimeout(() => { if (timer.current) finish(); }, 12000); // never hang
  };
  const finish = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setP((x) => (x ? 100 : 0));
    setDone(true);
  };

  // Internal link clicks.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // New page rendered → complete.
  useEffect(() => { finish(); }, [path, sp]);

  // Fade out after completing.
  useEffect(() => {
    if (!done || p !== 100) return;
    const t = setTimeout(() => { setP(0); setDone(false); }, 380);
    return () => clearTimeout(t);
  }, [done, p]);

  if (!p) return null;
  const grad = store ? "linear-gradient(90deg,#111 0%,#555 60%,#111 100%)" : "linear-gradient(90deg,#2563eb 0%,#7c3aed 45%,#d4a017 100%)";
  const glow = store ? "rgba(0,0,0,.35)" : "rgba(212,160,23,.7)";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[2000] h-[3px]" style={{ opacity: done && p === 100 ? 0 : 1, transition: "opacity .35s ease .1s" }}>
      <div className="relative h-full overflow-hidden" style={{ width: `${p}%`, background: grad, transition: "width .25s ease-out", boxShadow: `0 0 10px ${glow}` }}>
        <span className="nav-progress-shine absolute inset-y-0 w-24" />
      </div>
      <span className="absolute top-[-3px] h-[9px] w-[9px] rounded-full" style={{ left: `calc(${p}% - 6px)`, background: store ? "#111" : "#f5c542", boxShadow: `0 0 12px 3px ${glow}`, transition: "left .25s ease-out" }} />
    </div>
  );
}
