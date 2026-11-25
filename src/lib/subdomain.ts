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
    let domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN.trim().toLowerCase();
    // Strip protocol if accidentally included in env var (e.g. "https://mediqbyte.com" -> "mediqbyte.com")
    domain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return domain;
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
 * Extracts the tenant subdomain slug from the active browser window.
 * Returns null when on the platform root domain (e.g. localhost:3000, mediqbyte.com, www.mediqbyte.com).
 */
export function getTenantSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase();
  const rootDomain = getRootDomain();
  const rootHost = rootDomain.split(":")[0];

  // If on the root domain directly or localhost
  if (
    hostname === rootHost ||
    hostname === `www.${rootHost}` ||
    hostname === "localhost" ||
    hostname.startsWith("127.")
  ) {
    return null;
  }

  // If hostname ends with `.<rootHost>`
  if (hostname.endsWith(`.${rootHost}`)) {
    const candidate = hostname.slice(0, -(rootHost.length + 1)).toLowerCase();
    const firstSub = candidate.split(".")[0];
    if (firstSub && !RESERVED_SUBDOMAINS.has(firstSub)) {
      return firstSub;
    }
  }

  return null;
}

/**
 * Constructs the canonical root login URL with the tenant query parameter.
 * Handles both localhost/dev and production environments cleanly using standard URL API.
 * e.g. "kovelbyte" -> "https://mediqbyte.com/login?tenant=kovelbyte"
 *      or in dev -> "http://localhost:3000/login?tenant=kovelbyte"
 */
export function buildRootLoginUrl(tenantSlug?: string | null): string {
  const rootDomain = getRootDomain();
  const rootHost = rootDomain.split(":")[0];
  const isLocal = rootHost.includes("localhost") || rootHost.startsWith("127.");
  const protocol = isLocal ? "http:" : "https:";
  const baseUrl = `${protocol}//${rootDomain}`;

  const url = new URL("/login", baseUrl);
  if (tenantSlug) {
    const cleanSlug = tenantSlug.trim().toLowerCase();
    if (cleanSlug && !RESERVED_SUBDOMAINS.has(cleanSlug)) {
      url.searchParams.set("tenant", cleanSlug);
    }
  }
  return url.toString();
}

/**
 * Builds the full URL for a specific tenant organization subdomain portal.
 * e.g. "kovel" -> "https://kovel.mediqbyte.com/login" or "http://kovel.localhost:3000/login"
 */
export function buildTenantSubdomainUrl(slug: string, path: string = ""): string {
  const rootDomain = getRootDomain();
  const rootHost = rootDomain.split(":")[0];
  const isLocal = rootHost.includes("localhost") || rootHost.startsWith("127.");
  const protocol = isLocal ? "http:" : "https:";
  const cleanSlug = slug.trim().toLowerCase();

  // Guard against absolute URLs or protocols passed as path to prevent /https://... malformations
  let relativePath = path;
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    try {
      const parsed = new URL(relativePath);
      relativePath = parsed.pathname + parsed.search + parsed.hash;
    } catch {
      relativePath = "/";
    }
  }

  const cleanPath = relativePath.startsWith("/") ? relativePath : relativePath ? `/${relativePath}` : "";

  // On localhost / dev environments where *.localhost DNS is not configured by default, stay on root domain
  if (isLocal) {
    return `${protocol}//${rootDomain}${cleanPath}`;
  }

  return `${protocol}//${cleanSlug}.${rootDomain}${cleanPath}`;
}
