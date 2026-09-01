import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/site/product-card";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop",
  description: "Pencil portraits, customised mugs and personalised photo frames, made to order.",
};

const sorts = {
  newest: { createdAt: "desc" },
  "price-low": { price: "asc" },
  "price-high": { price: "desc" },
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const { category, sort, q } = await searchParams;
  const orderBy = sorts[(sort as keyof typeof sorts) ?? "newest"] ?? sorts.newest;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy,
    }),
  ]);

  const query = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category, sort, q, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const string = params.toString();
    return string ? `/products?${string}` : "/products";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Shop</h1>
      <p className="mt-2 text-sm text-muted">
        {products.length} {products.length === 1 ? "piece" : "pieces"} ready to be personalised.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link
          href={query({ category: undefined })}
          className={cn(
            "rounded-full border border-line px-4 py-1.5 text-sm hover:bg-blush",
            !category && "border-brand bg-brand text-white hover:bg-brand",
          )}
        >
          All
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            href={query({ category: item.slug })}
            className={cn(
              "rounded-full border border-line px-4 py-1.5 text-sm hover:bg-blush",
              category === item.slug && "border-brand bg-brand text-white hover:bg-brand",
            )}
          >
            {item.name}
          </Link>
        ))}

        <div className="ml-auto flex gap-2 text-sm">
          {(
            [
              ["newest", "Newest"],
              ["price-low", "Price ↑"],
              ["price-high", "Price ↓"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              href={query({ sort: value })}
              className={cn(
                "rounded-full px-3 py-1.5 text-muted hover:text-brand",
                (sort ?? "newest") === value && "font-medium text-ink",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="font-display text-xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted">
            Try another category, or message us for a fully custom piece.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
