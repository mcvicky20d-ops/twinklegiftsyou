import { site } from "@/lib/site";

/**
 * Resolves the public base URL.
 *
 * NEXT_PUBLIC_SITE_URL is filled in by hand in a hosting dashboard, so it
 * arrives malformed in ways `??` does not catch: an empty string (a saved but
 * blank field), stray whitespace, or a bare hostname with no scheme. Any of
 * those reaching `new URL()` throws and takes the whole build down, so each is
 * handled here and the domain is used as the fallback.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = `https://${site.domain}`;

  if (!configured) return fallback;

  // A bare host like "shop.vercel.app" is a URL to a person, but not to URL().
  const withScheme = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    return fallback;
  }
}
