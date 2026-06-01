import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/favicon.ico", "/_next"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = req.cookies.get("rv_admin_access")?.value;
  const refresh = req.cookies.get("rv_admin_refresh")?.value;

  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isPublic && !token && !refresh) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!isPublic && !token && refresh) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    url.searchParams.set("reason", "session_expired");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
