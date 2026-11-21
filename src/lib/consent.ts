/**
 * Cookie / tracking consent (browser only). The choice lives in localStorage and in a first-party
 * `vit_consent` cookie (so a server route can read it too). Essential cookies (login, cart) don't need it;
 * Meta Pixel and Google Analytics load only after "granted".
 */
export type Consent = "granted" | "denied";

export const CONSENT_COOKIE = "vit_consent";
const KEY = "vit_consent";
const EVENT = "vit-consent";
const MAX_AGE = 60 * 60 * 24 * 180; // ask again after ~6 months

const valid = (v: unknown): v is Consent => v === "granted" || v === "denied";

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (valid(v)) return v;
  } catch {}
  const m = document.cookie.match(/(?:^|;\s*)vit_consent=(granted|denied)/);
  return m ? (m[1] as Consent) : null;
}

export function writeConsent(v: Consent | null) {
  try {
    if (v) window.localStorage.setItem(KEY, v);
    else window.localStorage.removeItem(KEY);
  } catch {}
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = v
    ? `${CONSENT_COOKIE}=${v}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`
    : `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(EVENT));
}

export function onConsentChange(cb: () => void) {
  const storage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", storage);
  };
}
