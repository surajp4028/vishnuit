import "server-only";
import { headers } from "next/headers";

/** The main site (vishnuit.co.in) vs a seller's own connected domain. */
const MAIN = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://www.vishnuit.co.in").replace(/\/$/, "");
export const mainSiteUrl = MAIN;

export const bareHost = (host: string) => host.toLowerCase().split(":")[0].replace(/^www\./, "");

export function isMainHost(host: string) {
  const h = bareHost(host);
  const main = bareHost(new URL(MAIN()).hostname);
  return h === main || h === "vishnuit.co.in" || h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app");
}

/** "main" on vishnuit.co.in (and local/preview hosts), else the store's bare domain. Used to bind login sessions to a site. */
export async function currentSite(): Promise<string> {
  const h = (await headers()).get("host") ?? "";
  return !h || isMainHost(h) ? "main" : bareHost(h);
}

/** For account changes (email, phone, password, profile, avatar, jumping to the main site): only from the main site. */
export async function mainSiteOnly(): Promise<Response | null> {
  return (await currentSite()) === "main" ? null : Response.json({ error: "Please do this from your account on vishnuit.co.in." }, { status: 403 });
}
