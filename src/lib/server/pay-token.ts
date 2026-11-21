import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * Signed link for the plan payment page (vishnuit.co.in/catalog/payment/<CODE>?s=<token>).
 * Stores on their own domain can't share our login cookie, so the page and its two APIs
 * (plan quote / plan order) accept this token instead: it names the user + store and lasts 30 minutes.
 */
const sign = (p: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`pay:${p}`).digest("base64url");

export function makePayToken(userId: number, storeId: number, minutes = 30) {
  const p = Buffer.from(JSON.stringify({ u: userId, s: storeId, x: Date.now() + minutes * 60_000 })).toString("base64url");
  return `${p}.${sign(p)}`;
}

export function readPayToken(t: string | null | undefined): { u: number; s: number } | null {
  if (!t) return null;
  const [p, sig] = t.split(".");
  if (!p || !sig) return null;
  const want = sign(p);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const d = JSON.parse(Buffer.from(p, "base64url").toString()) as { u: number; s: number; x: number };
    return d.x > Date.now() && Number.isInteger(d.u) && Number.isInteger(d.s) ? { u: d.u, s: d.s } : null;
  } catch { return null; }
}
