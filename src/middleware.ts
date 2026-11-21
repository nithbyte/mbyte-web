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

  let subdomain: string | null = null;

  // Detect if hostname is a subdomain of rootHost (e.g. kovelbyte.mediqbyte.com)
  if (hostname.endsWith(`.${rootHost}`)) {
    const candidate = hostname.slice(0, -(rootHost.length + 1));
    const firstSub = candidate.split(".")[0];
    if (firstSub && !RESERVED_SUBDOMAINS.has(firstSub)) {
      subdomain = firstSub;
    }
  }

  // If someone visits /admin or /companies while on a tenant subdomain, redirect to central platform
  if (subdomain && (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/companies"))) {
    const targetUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${rootHost}`);
    return NextResponse.redirect(targetUrl, 307);
  }

  const response = NextResponse.next();

  if (subdomain) {
    response.headers.set("x-tenant-subdomain", subdomain);
    const cookieDomain = process.env.NODE_ENV === "production" ? `.${rootHost}` : undefined;
    response.cookies.set("mbyte_tenant_subdomain", subdomain, {
      path: "/",
      domain: cookieDomain,
      sameSite: "lax",
    });
  } else {
    response.headers.set("x-tenant-subdomain", "");
    response.cookies.delete("mbyte_tenant_subdomain");
  }

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
