import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${site.domain}`;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/orders", "/checkout"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
