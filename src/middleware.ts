import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "super",
  "platform",
  "mail",
  "static",
  "cdn",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();

  const defaultRoot = process.env.NODE_ENV === "production" ? "mediqbyte.com" : "localhost:3000";
  const envRoot = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || defaultRoot).toLowerCase();
  const rootHost = envRoot.split(":")[0];

  // In production, enforce single canonical domain https://mediqbyte.com
  // Redirect any subdomain (e.g. kovelbyte.mediqbyte.com) directly to mediqbyte.com
  if (
    process.env.NODE_ENV === "production" &&
    hostname !== rootHost &&
    hostname !== `www.${rootHost}` &&
    hostname.endsWith(`.${rootHost}`)
  ) {
    const candidate = hostname.slice(0, -(rootHost.length + 1));
    const firstSub = candidate.split(".")[0];

    const targetUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${rootHost}`);
    
    // If accessing /login from a tenant subdomain, preserve the tenant slug in the query
    if (request.nextUrl.pathname === "/login" && firstSub && !RESERVED_SUBDOMAINS.has(firstSub)) {
      targetUrl.searchParams.set("tenant", firstSub);
    }

    return NextResponse.redirect(targetUrl, 301);
  }

  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
