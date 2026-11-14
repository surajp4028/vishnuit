import "server-only";
import { createSign } from "node:crypto";
import { getIntegrations, type Integrations } from "./integrations";

/**
 * Google Sheets lead sync, configured in Admin → Settings → Integrations (env vars are a fallback). Either:
 *  A) Apps Script web app URL (+ secret) — see docs/google-apps-script.gs. No Google credentials needed.
 *  B) Sheet ID + service-account email + private key — share the sheet with the service-account email as Editor.
 */

export const SHEET_COLUMNS = [
  "Timestamp (IST)", "Lead ID", "Name", "Phone", "Email", "Service", "Budget", "City", "Message",
  "Landing Page", "UTM Source", "UTM Medium", "UTM Campaign", "UTM Content", "UTM Term", "fbclid", "Referrer", "Status",
] as const;

export type SheetLead = {
  id?: number | null;
  name: string; phone?: string; email?: string; service?: string; budget?: string; city?: string; message?: string;
  page?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string;
  fbclid?: string; referrer?: string;
};


function toRow(l: SheetLead) {
  const ts = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
  // Prefix phone with ' so Sheets keeps "+91…" as text
  const v = [ts, l.id ?? "", l.name, l.phone ? `'${l.phone}` : "", l.email, l.service, l.budget, l.city, l.message,
    l.page, l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content, l.utm_term, l.fbclid, l.referrer, "New"];
  // Guard against formula injection from user input
  return v.map((x) => { const s = String(x ?? ""); return /^[=+\-@]/.test(s) && !s.startsWith("'") ? `'${s}` : s; });
}

let tokenCache: { token: string; exp: number; email: string } | null = null;
async function googleToken(c: Integrations) {
  if (tokenCache && tokenCache.email === c.googleServiceAccountEmail && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const email = c.googleServiceAccountEmail;
  const key = c.googlePrivateKey.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
    signal: AbortSignal.timeout(10000),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error_description || "Google auth failed");
  tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000, email };
  return tokenCache.token;
}

async function appendViaApi(c: Integrations, tab: string, row: string[]) {
  const id = c.gsheetId;
  const token = await googleToken(c);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values`;
  const range = encodeURIComponent(`'${tab}'!A1`);
  // Write the header row once if the tab is empty
  const head = await fetch(`${base}/${range}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) }).then((r) => r.json());
  const rows = head.values ? [row] : [[...SHEET_COLUMNS], row];
  const res = await fetch(`${base}/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function appendViaWebhook(c: Integrations, tab: string, row: string[]) {
  const res = await fetch(c.gsheetWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script reads e.postData.contents
    body: JSON.stringify({ secret: c.gsheetSecret, tab, headers: SHEET_COLUMNS, row }),
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  const text = await res.text();
  if (!res.ok || !text.includes('"ok":true')) throw new Error(`Apps Script: ${res.status} ${text.slice(0, 200)}`);
}

export function sheetsConfigured(c: Integrations) {
  return Boolean(c.gsheetWebhookUrl || (c.gsheetId && c.googleServiceAccountEmail && c.googlePrivateKey));
}

/** Append a lead to the LP or website tab. Never throws — the form must never fail because of Sheets. */
export async function appendLead(target: "lp" | "site", lead: SheetLead): Promise<{ ok: boolean; error?: string }> {
  const c = await getIntegrations();
  if (!sheetsConfigured(c)) return { ok: false, error: "Google Sheets not configured" };
  if (target === "lp" ? !c.lpSheetEnabled : !c.siteSheetEnabled) return { ok: false, error: "Sheet sync disabled for this form" };
  const tab = target === "lp" ? c.lpTab : c.siteTab;
  try {
    const row = toRow(lead);
    if (c.gsheetWebhookUrl) await appendViaWebhook(c, tab, row);
    else await appendViaApi(c, tab, row);
    return { ok: true };
  } catch (e) {
    console.error("[gsheet]", (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}
