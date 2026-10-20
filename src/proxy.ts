import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// Optimistic check only (cookie present). Real verification happens in the
// admin layout and every admin API via auth().
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isLogin = pathname === "/admin/login";
    const hasSession = SESSION_COOKIES.some((c) => request.cookies.has(c));
    if (!isLogin && !hasSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/track")) {
    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  // /api is excluded so large uploads are not buffered by the proxy; every
  // API route authenticates for itself.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
