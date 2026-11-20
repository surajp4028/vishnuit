import "server-only";
import { resolve4, resolveCname } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { exec, queryOne } from "./db";

/*
 * Custom domains for seller stores.
 *
 * How it works:
 *  1. The seller types their domain (e.g. pandeyfashion.com) in Seller → Domain.
 *  2. We add it to our Vercel project (Vercel API) so Vercel accepts traffic for it and issues SSL.
 *  3. The seller points DNS at Vercel: A @ → 76.76.21.21 (root domain) and/or CNAME → cname.vercel-dns.com.
 *  4. A visitor opens pandeyfashion.com → Vercel sends the request to our app → src/proxy.ts sees an
 *     unknown host, looks up which store owns it, and rewrites the request to /catalog/~handle/… .
 *     The "~" tells the store pages that links should start at "/" instead of /catalog/@handle.
 */

export const VERCEL_A = "76.76.21.21";
export const VERCEL_CNAME = "cname.vercel-dns.com";

// Two-part endings, so "pandey.co.in" counts as a root domain (not a subdomain of co.in).
const TWO_PART = new Set(["co.in", "net.in", "org.in", "firm.in", "gen.in", "ind.in", "ac.in", "edu.in", "gov.in", "co.uk", "org.uk", "com.au", "co.nz", "com.sg", "co.za", "com.br", "co.jp"]);
const DOMAIN_RE = /^(?=.{4,190}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

/** "https://www.Shop.com/abc" → "www.shop.com". Returns null when it isn't a usable domain. */
export function cleanDomain(raw: unknown): string | null {
  const d = String(raw ?? "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").split(/[/?#:]/)[0].replace(/\.$/, "");
  if (!DOMAIN_RE.test(d)) return null;
  // Our own and Vercel's hosts can't be claimed by a store.
  if (/(^|\.)(vishnuit\.co\.in|vercel\.app|vercel-dns\.com|localhost)$/.test(d)) return null;
  // "www.brand.com" → "brand.com": we connect the root and send www to it.
  if (d.startsWith("www.") && isApex(d.slice(4))) return d.slice(4);
  return d;
}

/** Root ("apex") domain = no subdomain in front, e.g. pandeyfashion.com or pandey.co.in. */
export function isApex(d: string) {
  const parts = d.split(".");
  return parts.length === 2 || (parts.length === 3 && TWO_PART.has(parts.slice(1).join(".")));
}

/** The DNS records the seller has to add at their domain provider. */
export function dnsRecords(d: string) {
  if (isApex(d)) {
    return [
      { type: "A", name: "@", value: VERCEL_A, note: "Points your main domain to your store" },
      { type: "CNAME", name: "www", value: VERCEL_CNAME, note: "So www." + d + " works too" },
    ];
  }
  return [{ type: "CNAME", name: d.split(".")[0], value: VERCEL_CNAME, note: "Points " + d + " to your store" }];
}

/* ---------------- Vercel API ---------------- */
export const vercelReady = () => Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);

async function vercel<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T & { error?: { code?: string; message?: string } } }> {
  const team = process.env.VERCEL_TEAM_ID ? `${path.includes("?") ? "&" : "?"}teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
  const r = await fetch(`https://api.vercel.com${path}${team}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  return { ok: r.ok, status: r.status, data: (await r.json().catch(() => ({}))) as never };
}
const project = () => encodeURIComponent(process.env.VERCEL_PROJECT_ID ?? "");

/** Add the domain (and www. for a root domain, redirecting to it) to our Vercel project. */
export async function vercelAdd(d: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const one = async (body: Record<string, unknown>) => {
    const r = await vercel(`/v10/projects/${project()}/domains`, { method: "POST", body: JSON.stringify(body) });
    // Already on this project is fine.
    if (r.ok || r.data.error?.code === "domain_already_in_use_by_project" || r.data.error?.code === "domain_already_exists") return null;
    if (r.data.error?.code === "domain_already_in_use") return "This domain is connected to another Vercel account. Remove it there first, then try again.";
    return r.data.error?.message || "Could not add the domain right now.";
  };
  const e = await one({ name: d });
  if (e) return { ok: false, error: e };
  if (isApex(d)) await one({ name: `www.${d}`, redirect: d, redirectStatusCode: 308 });
  return { ok: true };
}

export async function vercelRemove(d: string) {
  await vercel(`/v9/projects/${project()}/domains/${encodeURIComponent(d)}`, { method: "DELETE" }).catch(() => null);
  if (isApex(d)) await vercel(`/v9/projects/${project()}/domains/${encodeURIComponent(`www.${d}`)}`, { method: "DELETE" }).catch(() => null);
}

export type DomainStatus = {
  state: "live" | "dns" | "verify" | "platform";
  /** Extra TXT record Vercel wants when the domain was used elsewhere before. */
  verification: { type: string; domain: string; value: string }[];
  message: string;
};

/** Is the domain pointing at us yet? Uses Vercel when set up, otherwise a plain DNS lookup. */
export async function domainStatus(d: string): Promise<DomainStatus> {
  if (vercelReady()) {
    const [info, cfg] = await Promise.all([
      vercel<{ verified?: boolean; verification?: { type: string; domain: string; value: string }[] }>(`/v9/projects/${project()}/domains/${encodeURIComponent(d)}`),
      vercel<{ misconfigured?: boolean }>(`/v6/domains/${encodeURIComponent(d)}/config`),
    ]);
    if (info.ok && info.data.verified === false && info.data.verification?.length) {
      await vercel(`/v9/projects/${project()}/domains/${encodeURIComponent(d)}/verify`, { method: "POST" }).catch(() => null);
      return { state: "verify", verification: info.data.verification, message: "Add the TXT record below to prove you own this domain." };
    }
    if (cfg.ok && cfg.data.misconfigured === false) return { state: "live", verification: [], message: "Your domain is connected. SSL (https) is on." };
    return { state: "dns", verification: [], message: "Waiting for your DNS records. Changes can take from a few minutes to a few hours." };
  }
  const ok = await dnsPointsHere(d);
  return ok
    ? { state: "platform", verification: [], message: "Your DNS is correct. We are finishing the setup on our side — this is done by our team." }
    : { state: "dns", verification: [], message: "Waiting for your DNS records. Changes can take from a few minutes to a few hours." };
}

async function dnsPointsHere(d: string) {
  try {
    if (isApex(d)) return (await resolve4(d)).includes(VERCEL_A);
    return (await resolveCname(d)).some((c) => c.toLowerCase().endsWith("vercel-dns.com"));
  } catch {
    return false;
  }
}

/* ---------------- shared by Seller → Domain and Admin → Stores ---------------- */
type DomainStore = { id: number; handle: string; domain: string | null; domain_ok: boolean | number };

/** Current domain, the DNS records to add, and whether it's live (also refreshes domain_ok). */
export async function domainInfo(store: DomainStore) {
  if (!store.domain) return { domain: null };
  const status = await domainStatus(store.domain);
  const ok = status.state === "live";
  if (ok !== Boolean(Number(store.domain_ok))) {
    await exec("UPDATE stores SET domain_ok=? WHERE id=?", [ok ? 1 : 0, store.id]);
    revalidatePath(`/catalog/@${store.handle}`, "layout");
  }
  return { domain: store.domain, records: dnsRecords(store.domain), status };
}

/** Connect (or switch to) a domain for a store. Plan checks are the caller's job. */
export async function connectDomain(store: DomainStore, raw: unknown): Promise<{ ok: true; info: Awaited<ReturnType<typeof domainInfo>> } | { ok: false; status: number; error: string }> {
  const d = cleanDomain(raw);
  if (!d) return { ok: false, status: 422, error: "Enter a domain like pandeyfashion.com or shop.pandeyfashion.com." };
  const taken = await queryOne<{ id: number; handle: string }>("SELECT id, handle FROM stores WHERE (domain=? OR domain=? OR domain=?) AND id<>?", [d, `www.${d}`, d.replace(/^www\./, ""), store.id]);
  if (taken) return { ok: false, status: 409, error: `This domain is already connected to another store (@${taken.handle}).` };
  if (store.domain && store.domain !== d && vercelReady()) await vercelRemove(store.domain);
  if (vercelReady()) {
    const r = await vercelAdd(d);
    if (!r.ok) return { ok: false, status: 422, error: r.error };
  }
  await exec("UPDATE stores SET domain=?, domain_ok=0 WHERE id=?", [d, store.id]);
  revalidatePath(`/catalog/@${store.handle}`, "layout");
  return { ok: true, info: { domain: d, records: dnsRecords(d), status: await domainStatus(d) } };
}

/** Disconnect: the store keeps working at vishnuit.co.in/catalog/@handle. */
export async function disconnectDomain(store: DomainStore) {
  if (store.domain && vercelReady()) await vercelRemove(store.domain);
  await exec("UPDATE stores SET domain=NULL, domain_ok=0 WHERE id=?", [store.id]);
  revalidatePath(`/catalog/@${store.handle}`, "layout");
}

/* ---------------- Google login on a store's own domain ----------------
 * Google only accepts the callback address registered in Google Console (vishnuit.co.in).
 * So a shopper on pandey.com is sent to vishnuit.co.in for Google, and after it succeeds we
 * hand the login back with a one-time code (2 minutes) that only that store's domain can redeem.
 */
const MAIN = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://www.vishnuit.co.in").replace(/\/$/, "");
export const mainSiteUrl = MAIN;
export function isMainHost(host: string) {
  const h = host.toLowerCase().split(":")[0].replace(/^www\./, "");
  const main = new URL(MAIN()).hostname.replace(/^www\./, "");
  return h === main || h === "vishnuit.co.in" || h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app");
}
/** Scheme + host to send the shopper back to (http only for local test hosts). */
export const storeOrigin = (host: string) => `${process.env.NODE_ENV === "development" ? "http" : "https"}://${host}`;
