import { NextRequest, NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/types";

const LOCALE_SET = new Set<string>(LOCALES);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API, Next internals, demo, static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/demo") ||
    pathname.includes(".") // static files (e.g. favicon.ico, robots.txt, sitemap.xml)
  ) {
    return NextResponse.next();
  }

  // 301 redirect old tool pages to hash anchors
  // NextURL.hash is not included in the Location header, so we construct the URL manually
  const hashMap: Record<string, string> = {
    "/check": "#check",
    "/audit": "#audit",
    "/brand": "#brand",
  };
  const hash = hashMap[pathname];
  if (hash) {
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(`${origin}/${hash}`, 301);
  }

  // /zh → pass through to [locale] segment
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && LOCALE_SET.has(firstSegment) && firstSegment !== DEFAULT_LOCALE) {
    const response = NextResponse.next();
    response.headers.set("x-locale", firstSegment);
    return response;
  }

  // / → rewrite internally to /en (URL stays /)
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-locale", DEFAULT_LOCALE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt (static files)
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
