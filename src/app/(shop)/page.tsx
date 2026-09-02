import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { TrustBar } from "@/components/site/trust-bar";
import { HeroSlider } from "@/components/site/hero-slider";
import { Confetti } from "@/components/site/decorations";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    safeQuery(() => prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 6 }), []),
    safeQuery(
      () =>
        prisma.product.findMany({
          where: { isActive: true, isFeatured: true },
          include: { category: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      [],
    ),
  ]);

  return (
    <>
      <HeroSlider />

      <TrustBar />

      {categories.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="font-display text-3xl">Browse by craft</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/collections/${category.slug}`}
                className="group relative flex h-52 items-end overflow-hidden rounded-2xl border border-line bg-blush p-6"
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                {/* Label sits on top of whatever image the shop uploads, so it
                    needs a scrim rather than relying on the artwork being dark. */}
                {category.image ? (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent"
                  />
                ) : null}
                <div className="relative">
                  <p
                    className={`font-display text-2xl ${category.image ? "text-white drop-shadow" : ""}`}
                  >
                    {category.name}
                  </p>
                  {category.description ? (
                    <p
                      className={`mt-1 line-clamp-1 text-sm ${
                        category.image ? "text-white/85" : "text-muted"
                      }`}
                    >
                      {category.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl">Loved this month</h2>
            <Link href="/products" className="inline-block py-1.5 text-sm text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <p className="font-display text-xl">The shop is being set up</p>
            <p className="mt-2 text-sm text-muted">
              Sign in to the admin panel and add your first products to see them here.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-2xl bg-brand px-8 py-14 text-center text-white">
          <Confetti count={14} className="opacity-70" />
          <h2 className="relative font-display text-3xl">Have a photo in mind?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-white/85">
            Send it across and we will tell you exactly how it will look as a sketch, a mug or a
            framed keepsake — before you pay a rupee.
          </p>
          <Link href="/contact" className="relative mt-7 inline-block">
            <Button variant="outline" size="lg">
              Start a custom order
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
