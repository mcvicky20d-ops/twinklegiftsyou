import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${base}/gallery`, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/faq`, changeFrequency: "monthly" as const, priority: 0.6 },
  ].map((route) => ({ ...route, lastModified: new Date() }));

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);

    return [
      ...staticRoutes,
      // Collection pages rank for the category terms, so they sit just under
      // the shop itself in priority.
      ...categories.map((category) => ({
        url: `${base}/collections/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...products.map((product) => ({
        url: `${base}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // A sitemap is not worth failing the build over if the database is unreachable.
    return staticRoutes;
  }
}
