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
  const rawEnvRoot = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || defaultRoot).toLowerCase();
  const envRoot = rawEnvRoot.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
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

  const isLocal = rootHost.includes("localhost") || rootHost.startsWith("127.");
  const protocol = isLocal ? "http:" : "https:";

  if (subdomain) {
    const pathname = request.nextUrl.pathname;

    // 1. If someone visits /admin or /companies while on a tenant subdomain, redirect to central platform
    if (pathname.startsWith("/admin") || pathname.startsWith("/companies")) {
      const targetUrl = new URL(pathname + request.nextUrl.search, `${protocol}//${envRoot}`);
      return NextResponse.redirect(targetUrl, 307);
    }

    // 2. If someone visits /login on a tenant subdomain, redirect to canonical root login with tenant query
    if (pathname === "/login" || pathname === "/login/") {
      const loginUrl = new URL(`/login?tenant=${encodeURIComponent(subdomain)}`, `${protocol}//${envRoot}`);
      return NextResponse.redirect(loginUrl, 307);
    }

    // 3. If someone visits / without an auth token cookie, redirect immediately to canonical root login with tenant query
    const authToken = request.cookies.get("mbyte_auth_token")?.value;
    if ((pathname === "/" || pathname === "") && !authToken) {
      const loginUrl = new URL(`/login?tenant=${encodeURIComponent(subdomain)}`, `${protocol}//${envRoot}`);
      return NextResponse.redirect(loginUrl, 307);
    }

    // 4. On a tenant subdomain with an active session, rewrite root / to /dashboard so tenant command center renders
    if (pathname === "/" || pathname === "") {
      const rewriteUrl = new URL(`/dashboard${request.nextUrl.search}`, request.url);
      const res = NextResponse.rewrite(rewriteUrl);
      res.headers.set("x-tenant-subdomain", subdomain);
      const cookieDomain = process.env.NODE_ENV === "production" ? `.${rootHost}` : undefined;
      res.cookies.set("mbyte_tenant_subdomain", subdomain, {
        path: "/",
        domain: cookieDomain,
        sameSite: "lax",
      });
      return res;
    }
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
    const cookieDomain = process.env.NODE_ENV === "production" ? `.${rootHost}` : undefined;
    response.cookies.delete({
      name: "mbyte_tenant_subdomain",
      domain: cookieDomain,
      path: "/",
    });
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
