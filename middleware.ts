import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isValidLocale, locales } from "./lib/i18n/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Already has locale, just pass through
    return NextResponse.next();
  }

  // Detect locale from cookie or Accept-Language header
  let locale: typeof defaultLocale | "fr" = defaultLocale;

  // Check cookie first
  const localeCookie = request.cookies.get("NEXT_LOCALE");
  if (localeCookie && isValidLocale(localeCookie.value)) {
    locale = localeCookie.value as "en" | "fr";
  } else {
    // Check Accept-Language header
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(",")[0]
        ?.split("-")[0]
        ?.toLowerCase();
      if (preferredLocale === "fr") {
        locale = "fr";
      }
    }
  }

  // Rewrite to add locale prefix internally
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - _next (Next.js internals)
    // - Static files
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

