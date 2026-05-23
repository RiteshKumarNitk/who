import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/_next/", "/icons/", "/manifest/", "/sw.js", "/offline.html"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // API auth check (handled in route handlers with withAuth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Page routes: check auth token
  const token = request.cookies.get("auth_token")?.value;
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest/).*)"],
};
