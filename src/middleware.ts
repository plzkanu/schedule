import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionToken, SESSION_COOKIE } from "@/lib/session-token";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/activity",
  "/reviews",
  "/projects",
  "/tech-capabilities",
  "/weekly-work",
  "/admin",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isViewerWritePath(pathname: string) {
  if (
    pathname === "/projects/new" ||
    pathname === "/tech-capabilities/new" ||
    pathname === "/reviews/new" ||
    pathname === "/weekly-work/new"
  ) {
    return true;
  }
  if (/^\/projects\/[^/]+\/edit$/.test(pathname)) {
    return true;
  }
  if (/^\/tech-capabilities\/[^/]+\/edit$/.test(pathname)) {
    return true;
  }
  if (/^\/reviews\/[^/]+\/edit$/.test(pathname)) {
    return true;
  }
  return /^\/weekly-work\/[^/]+\/edit$/.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await parseSessionToken(token) : null;

  if (isProtectedPath(pathname)) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role === "viewer" && isViewerWritePath(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/activity/:path*",
    "/reviews/:path*",
    "/projects/:path*",
    "/tech-capabilities/:path*",
    "/weekly-work/:path*",
    "/admin/:path*",
    "/login",
  ],
};
