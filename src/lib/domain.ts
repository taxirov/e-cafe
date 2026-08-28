export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "e-cafe.uz";
export const APP_SUBDOMAIN = "app";
export const APP_DOMAIN = `${APP_SUBDOMAIN}.${ROOT_DOMAIN}`;

const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "cafe",
  "dashboard",
  "static",
  "assets",
  "cdn",
  "login",
  "register",
  "order",
  "t",
]);

/** Extracts the cafe subdomain from a request Host header, or null for the root/apex domain. */
export function extractCafeSlug(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  // local dev: "javohir.localhost" -> "javohir"
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return sub && !RESERVED_SLUGS.has(sub) ? sub : null;
  }

  const root = ROOT_DOMAIN.toLowerCase();
  if (hostname === root || hostname === `www.${root}`) return null;

  if (hostname.endsWith(`.${root}`)) {
    const sub = hostname.slice(0, -1 * (`.${root}`.length));
    return sub && !RESERVED_SLUGS.has(sub) ? sub : null;
  }

  // Vercel preview deployments (project.vercel.app) — treat as root domain.
  return null;
}

/**
 * True when the host is actually part of our own domain (the apex, an
 * `app.`/cafe subdomain, or `*.localhost` in dev). False for anything else —
 * a Vercel preview/fallback URL, a raw IP, etc. — where redirecting to
 * `app.{ROOT_DOMAIN}` would just bounce the visitor to a domain that may not
 * even be configured yet, instead of letting the page render where it is.
 */
export function isOwnDomainHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  const root = ROOT_DOMAIN.toLowerCase();
  return hostname === root || hostname.endsWith(`.${root}`);
}

/** True for app.e-cafe.uz (or app.localhost in dev) — the staff dashboard host. */
export function isAppHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === `${APP_SUBDOMAIN}.localhost`) return true;
  return hostname === APP_DOMAIN.toLowerCase();
}

/** Absolute origin for app.e-cafe.uz, matching the current environment (http://app.localhost:PORT in dev). */
export function appOrigin(host: string): string {
  const [hostname, port] = host.split(":");
  if (hostname.toLowerCase().endsWith(".localhost") || hostname.toLowerCase() === "localhost") {
    return `http://${APP_SUBDOMAIN}.localhost${port ? `:${port}` : ""}`;
  }
  return `https://${APP_DOMAIN}`;
}

/**
 * Absolute URL for a cafe's public ordering page. On our own domain this is
 * the subdomain ({slug}.e-cafe.uz); on a Vercel preview/fallback host (no
 * subdomain routing available there) it falls back to a path on that same
 * host ({host}/{slug}) — still a working link, just not the pretty one.
 */
export function cafeOrigin(slug: string, host: string): string {
  const [hostname, port] = host.split(":");
  if (hostname.toLowerCase().endsWith(".localhost") || hostname.toLowerCase() === "localhost") {
    return `http://${slug}.localhost${port ? `:${port}` : ""}`;
  }
  if (!isOwnDomainHost(host)) return `https://${host}/${slug}`;
  return `https://${slug}.${ROOT_DOMAIN}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
