"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import { onConsentChange, readConsent, writeConsent } from "@/lib/consent";

const PLATFORM_PRIVACY = "https://www.vishnuit.co.in/privacy-policy";

/** "ssr" before hydration, "unset" when the visitor hasn't chosen yet. */
function useConsent() {
  return useSyncExternalStore(onConsentChange, () => readConsent() ?? "unset", () => "ssr" as const);
}

/** Renders its children (tracking scripts) only after the visitor has accepted. */
export function ConsentGate({ children }: { children: React.ReactNode }) {
  return useConsent() === "granted" ? <>{children}</> : null;
}

// Several components may mount the banner on one page (site layout + a pixel); only the first one shows it.
let owner: object | null = null;

/** Small Accept / Reject bar at the bottom of the screen. Reject is exactly as easy as Accept. */
export function ConsentBanner({ policyHref = PLATFORM_PRIVACY }: { policyHref?: string }) {
  const consent = useConsent();
  const [mine, setMine] = useState(false);
  useEffect(() => {
    const me = {};
    if (!owner) {
      owner = me;
      setMine(true); // claim the page-wide singleton after mount
    }
    return () => {
      if (owner === me) owner = null;
    };
  }, []);
  if (!mine || consent !== "unset") return null;

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie consent" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl sm:bottom-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 text-slate-700 shadow-[0_12px_40px_-12px_rgba(2,6,23,.35)] backdrop-blur sm:flex-row sm:items-center sm:gap-4 dark:border-white/10 dark:bg-[#0b1020]/95 dark:text-white/80">
        <p className="flex-1 text-[13px] leading-relaxed">
          <Cookie className="mr-1.5 -mt-0.5 inline size-4 text-[#d4a017]" />
          We use essential cookies for login and your cart. With your OK we also use Meta Pixel / Google Analytics to measure visits and ads.{" "}
          <a href={policyHref} className="font-semibold text-[#1d4ed8] underline underline-offset-2 dark:text-[#93b4ff]">Privacy policy</a>
        </p>
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <button type="button" onClick={() => writeConsent("denied")} className="rounded-full border border-slate-300 px-4 py-2 text-[13px] font-bold text-slate-800 transition hover:border-slate-500 dark:border-white/25 dark:text-white">Reject</button>
          <button type="button" onClick={() => writeConsent("granted")} className="rounded-full bg-[#1d4ed8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#1e40af]">Accept</button>
        </div>
      </div>
    </div>
  );
}

/** "Cookie settings" link: forgets the choice and reloads so the banner asks again (also stops already-loaded pixels). */
export function ConsentReset({ className, label = "Cookie settings" }: { className?: string; label?: string }) {
  return (
    <button type="button" className={className} onClick={() => { writeConsent(null); window.location.reload(); }}>
      {label}
    </button>
  );
}
