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

/**
 * Returns the configured root domain (e.g. "localhost:3000" in dev or "mypharmaapp.com" in prod).
 */
export function getRootDomain(): string {
  if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return process.env.NEXT_PUBLIC_ROOT_DOMAIN.trim().toLowerCase();
  }
  if (typeof window !== "undefined") {
    const host = window.location.host.toLowerCase();
    const parts = host.split(".");
    // If e.g. "kovel.localhost:3000", strip the subdomain
    if (parts.length > 1 && parts[parts.length - 1].startsWith("localhost")) {
      return parts.slice(1).join(".");
    }
    // If 3+ parts e.g. "kovel.mediqbyte.com" or "kovel.localhost:3000"
    if (parts.length >= 3) {
      return parts.slice(parts.length - 2).join(".");
    }
    return host;
  }
  return process.env.NODE_ENV === "production" ? "mediqbyte.com" : "localhost:3000";
}

/**
 * Extracts the tenant subdomain slug from the active browser window or cookie.
 * Returns null when on the platform root domain (e.g. localhost:3000, mediqbyte.com).
 */
export function getTenantSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Check for cookie set by Next.js middleware
  const matchCookie = document.cookie.match(/(?:^|;\s*)mbyte_tenant_subdomain=([^;]+)/);
  if (matchCookie && matchCookie[1]) {
    const slug = decodeURIComponent(matchCookie[1]).trim().toLowerCase();
    if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
      return slug;
    }
  }

  // 2. Direct hostname inspection
  const host = window.location.host.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  const rootDomain = getRootDomain();
  const rootHost = rootDomain.split(":")[0];

  // If host ends with `.<rootHost>`
  if (hostname.endsWith(`.${rootHost}`)) {
    const candidate = hostname.slice(0, -(rootHost.length + 1)).toLowerCase();
    // Handle multi-level like "kovel" from "kovel.localhost"
    const sub = candidate.split(".")[0];
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      return sub;
    }
  }

  return null;
}

/**
 * Builds the full URL for a specific tenant organization subdomain portal.
 * e.g. "kovel" -> "https://kovel.mediqbyte.com/login" or "http://kovel.localhost:3000/login"
 */
export function buildTenantSubdomainUrl(slug: string, path: string = ""): string {
  const rootDomain = getRootDomain();
  const defaultProtocol = rootDomain.includes("localhost") || rootDomain.startsWith("127.") ? "http:" : "https:";
  const protocol = typeof window !== "undefined" && window.location.protocol ? window.location.protocol : defaultProtocol;
  const cleanSlug = slug.trim().toLowerCase();
  const cleanPath = path.startsWith("/") ? path : path ? `/${path}` : "";

  return `${protocol}//${cleanSlug}.${rootDomain}${cleanPath}`;
}
