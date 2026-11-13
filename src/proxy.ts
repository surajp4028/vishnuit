import { NextResponse, type NextRequest } from "next/server";

// Fast early redirect for admin pages when no session cookie exists.
// Full signature verification happens server-side in the admin layout / API.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !req.cookies.get("vit_admin")) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
