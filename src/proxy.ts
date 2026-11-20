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
const cache = new Map<string, { handle: string | null; at: number }>();
const TTL = 60_000;

async function lookup(req: NextRequest, host: string) {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL) return hit.handle;
  // In dev the made-up test host doesn't resolve, so ask the local server directly.
  const origin = process.env.NODE_ENV === "development" ? `http://127.0.0.1:${req.nextUrl.port || 3000}` : req.nextUrl.origin;
  const handle = await fetch(`${origin}/api/catalog/domain?host=${encodeURIComponent(host)}`)
    .then((r) => (r.ok ? (r.json() as Promise<{ handle: string | null }>) : { handle: null }))
    .then((j) => j.handle)
    .catch(() => null);
  cache.set(host, { handle, at: Date.now() });
  return handle;
}

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
  // The main site's admin and seller panel aren't part of the store's domain.
  // (/login, /account, /cart… are the store's own pages and stay here.)
  if (/^\/(admin|seller|catalog)(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, process.env.NEXT_PUBLIC_SITE_URL || "https://www.vishnuit.co.in"));
  }
  const url = req.nextUrl.clone();
  url.pathname = `/catalog/~${handle}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

// Everything except Next's own files and API routes.
export const config = { matcher: ["/((?!_next/static|_next/image|api/).*)"] };
