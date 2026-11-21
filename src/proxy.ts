import { NextResponse, type NextRequest } from "next/server";

/*
 * 1. Admin pages: fast redirect to the login page when there's no session cookie
 *    (full signature checks happen server-side in the admin layout / APIs).
 * 2. Seller custom domains: a request for pandeyfashion.com/p/shirt is shown from
 *    /catalog/~pandeyfashion/p/shirt (see src/lib/server/domains.ts for the full flow).
 */

const hostOf = (u: string | undefined) => (u ? u.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].replace(/^www\./, "").toLowerCase() : "");
const OUR_HOSTS = new Set(["localhost", "127.0.0.1", "vishnuit.co.in", hostOf(process.env.NEXT_PUBLIC_SITE_URL), hostOf(process.env.VERCEL_PROJECT_PRODUCTION_URL)].filter(Boolean));
const isOurHost = (h: string) => OUR_HOSTS.has(h) || h.endsWith(".vercel.app") || h.endsWith(".localhost");

// Small in-memory cache of host → store handle, so most requests skip the lookup.
// Only real answers are cached: found for 60s, "not connected" for 10s. Failures are never cached.
const cache = new Map<string, { handle: string | null; until: number }>();
const FOUND_TTL = 60_000;
const MISS_TTL = 10_000;
const CACHE_MAX = 500;
/** Lookup couldn't be answered (timeout, network error, 503) — different from "not connected". */
const UNAVAILABLE = Symbol("unavailable");

async function lookup(req: NextRequest, host: string): Promise<string | null | typeof UNAVAILABLE> {
  const hit = cache.get(host);
  if (hit && Date.now() < hit.until) return hit.handle;
  if (hit) cache.delete(host);
  // In dev the made-up test host doesn't resolve, so ask the local server directly.
  const origin = process.env.NODE_ENV === "development" ? `http://127.0.0.1:${req.nextUrl.port || 3000}` : req.nextUrl.origin;
  let handle: string | null;
  try {
    const r = await fetch(`${origin}/api/catalog/domain?host=${encodeURIComponent(host)}`, { signal: AbortSignal.timeout(3000) });
    if (r.status !== 200) return UNAVAILABLE;
    const j = (await r.json()) as { handle?: unknown };
    handle = typeof j.handle === "string" && j.handle ? j.handle : null;
  } catch {
    return UNAVAILABLE;
  }
  // Map keeps insertion order → drop the oldest entries when full.
  while (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(host, { handle, until: Date.now() + (handle ? FOUND_TTL : MISS_TTL) });
  return handle;
}

const UNAVAILABLE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Temporarily unavailable</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;color:#0a0f1f;font-family:Inter,Arial,sans-serif;text-align:center;padding:16px"><div><h1 style="font-size:20px;margin:0 0 8px">Store is temporarily unavailable</h1><p style="margin:0 0 20px;color:#556">Please refresh in a moment.</p><a href="" style="background:#0a0f1f;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;font-weight:600">Refresh</a></div></body></html>`;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const bare = host.replace(/^www\./, "");

  if (isOurHost(bare)) {
    if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !req.cookies.get("vit_admin")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    // "~" paths are only for custom domains.
    if (pathname.startsWith("/catalog/~")) return NextResponse.redirect(new URL(pathname.replace("/catalog/~", "/catalog/@"), req.url));
    // Store sitemaps live in an API route.
    const sm = pathname.match(/^\/catalog\/@([a-z0-9_-]+)\/sitemap\.xml$/i);
    if (sm) { const url = req.nextUrl.clone(); url.pathname = `/api/catalog/@${sm[1]}/sitemap`; return NextResponse.rewrite(url); }
    return NextResponse.next();
  }

  // ---- A seller's own domain ----
  // Public files (images, icons) are served as-is; sitemap.xml and robots.txt belong to the store.
  if (/\.[a-z0-9]+$/i.test(pathname) && pathname !== "/sitemap.xml" && pathname !== "/robots.txt") return NextResponse.next();
  const handle = await lookup(req, bare);
  if (handle === UNAVAILABLE) {
    return new NextResponse(UNAVAILABLE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "5" } });
  }
  if (!handle) return new NextResponse("This domain is not connected to a store.", { status: 404, headers: { "Content-Type": "text/plain" } });
  if (pathname === "/sitemap.xml") { const url = req.nextUrl.clone(); url.pathname = `/api/catalog/@${handle}/sitemap`; return NextResponse.rewrite(url); }
  if (pathname === "/robots.txt") {
    const origin = `https://${host}`;
    return new NextResponse(`User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /account\nDisallow: /login\nDisallow: /register\n\nSitemap: ${origin}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  }

  // Old-style links (/catalog/@handle/…) on the custom domain → the clean address.
  const old = `/catalog/@${handle}`;
  if (pathname === old || pathname.startsWith(`${old}/`)) {
    return NextResponse.redirect(new URL((pathname.slice(old.length) || "/") + req.nextUrl.search, `${req.nextUrl.protocol}//${req.headers.get("host")}`), 308);
  }
  // The seller panel also works here for the store's owner (checked in requireSeller); it isn't a store page, so no rewrite.
  if (pathname === "/seller" || pathname.startsWith("/seller/")) return NextResponse.next();
  // The main site's admin isn't part of the store's domain.
  // (/login, /account, /cart… are the store's own pages and stay here.)
  if (/^\/(admin|catalog)(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, process.env.NEXT_PUBLIC_SITE_URL || "https://www.vishnuit.co.in"));
  }
  const url = req.nextUrl.clone();
  url.pathname = `/catalog/~${handle}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

// Everything except Next's own files and API routes.
export const config = { matcher: ["/((?!_next/static|_next/image|api/).*)"] };
