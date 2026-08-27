import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { extractCafeSlug, isAppHost, appOrigin } from "@/lib/domain";

// Uses the Edge-safe auth config (no Prisma) since middleware runs on the Edge runtime.
const { auth } = NextAuth(authConfig);

// Paths that must always resolve to the shared app (auth, dashboard, order
// tracking, api), even when visited through a cafe's subdomain.
const GLOBAL_PATH_PREFIXES = [
  "/_next",
  "/api",
  "/dashboard",
  "/login",
  "/register",
  "/order",
  "/manifest.webmanifest",
];

// The subset of GLOBAL_PATH_PREFIXES that live exclusively on app.e-cafe.uz —
// e-cafe.uz itself is the public landing page and redirects these over.
const APP_ONLY_PATH_PREFIXES = ["/dashboard", "/login", "/register"];

const ROLE_PREFIXES: Record<string, string[]> = {
  "/dashboard/admin": ["SUPER_ADMIN"],
  "/dashboard/owner": ["OWNER"],
  "/dashboard/waiter": ["OWNER", "WAITER"],
  "/dashboard/kitchen": ["OWNER", "KITCHEN"],
};

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host") ?? "";
  const cafeSlug = extractCafeSlug(host);
  const appHost = isAppHost(host);

  // Multi-tenant subdomain rewrite: javohir.e-cafe.uz/* -> /javohir/*
  const isGlobalPath = GLOBAL_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
  if (cafeSlug && !isGlobalPath) {
    const url = nextUrl.clone();
    url.pathname = `/${cafeSlug}${nextUrl.pathname === "/" ? "" : nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  // e-cafe.uz is the public landing page — auth/dashboard pages live on
  // app.e-cafe.uz only, so send those requests over there.
  if (!cafeSlug && !appHost) {
    const isAppOnlyPath = APP_ONLY_PATH_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
    if (isAppOnlyPath) {
      const url = new URL(`${nextUrl.pathname}${nextUrl.search}`, appOrigin(host));
      return NextResponse.redirect(url);
    }
  }

  // app.e-cafe.uz has no landing page of its own — "/" goes straight to login.
  if (appHost && nextUrl.pathname === "/") {
    const url = nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-gated dashboard routes
  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((p) => nextUrl.pathname.startsWith(p));
  if (matchedPrefix) {
    const allowedRoles = ROLE_PREFIXES[matchedPrefix];
    const role = req.auth?.user?.role;
    if (!req.auth) {
      const loginUrl = nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!role || !allowedRoles.includes(role)) {
      const homeUrl = nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  } else if (nextUrl.pathname.startsWith("/dashboard")) {
    // any other /dashboard/* route just requires being signed in
    if (!req.auth) {
      const loginUrl = nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
