import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { site } from "@/lib/site";
import { AddToCart } from "@/components/site/add-to-cart";
import { storageEnabled } from "@/lib/storage";
import { ProductCard } from "@/components/site/product-card";
import { Badge } from "@/components/ui/badge";
import { absolute, breadcrumbSchema, canonical, jsonLdGraph, productSchema } from "@/lib/seo";

export const revalidate = 60;

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { category: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  const description = `${product.description.replace(/\s+/g, " ").slice(0, 140).trim()}… Made to order, delivered across India.`;

  return {
    title: `${product.title} — Buy Online in India`,
    description,
    ...canonical(`/products/${product.slug}`),
    openGraph: {
      title: product.title,
      description,
      url: absolute(`/products/${product.slug}`),
      type: "website",
      images: product.images.slice(0, 1),
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, NOT: { id: product.id } },
    include: { category: { select: { name: true } } },
    take: 4,
  });

  const structuredData = jsonLdGraph(
    productSchema({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      images: product.images,
      stock: product.stock,
      categoryName: product.category.name,
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Shop", path: "/products" },
      { name: product.category.name, path: `/collections/${product.category.slug}` },
      { name: product.title, path: `/products/${product.slug}` },
    ]),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />

      <nav className="text-sm text-muted">
        <Link href="/products" className="hover:text-brand">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/collections/${product.category.slug}`} className="hover:text-brand">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-blush">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-5xl text-brand/40">
                {product.title.charAt(0)}
              </div>
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((image) => (
                <div
                  key={image}
                  className="relative aspect-square overflow-hidden rounded-xl border border-line"
                >
                  <Image src={image} alt={product.title} fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <Badge tone="brand">{product.category.name}</Badge>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">{product.title}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl">{formatPrice(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price ? (
              <span className="text-muted line-through">{formatPrice(product.comparePrice)}</span>
            ) : null}
            <span className="text-xs text-muted">Inclusive of taxes</span>
          </div>

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted">
            {product.description}
          </p>

          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              title: product.title,
              price: product.price,
              image: product.images[0],
              customizable: product.customizable,
              customNote: product.customNote,
              stock: product.stock,
              customisationModes: product.customisationModes,
            }}
            uploadsEnabled={storageEnabled()}
          />

          <dl className="mt-8 grid gap-3 border-t border-line pt-6 text-sm">
            <div className="flex gap-3">
              <dt className="w-36 text-muted">Made in</dt>
              <dd>5–7 working days for customised pieces</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-36 text-muted">Shipping</dt>
              <dd>Across India, tracked and padded</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-36 text-muted">Questions?</dt>
              <dd>
                <a href={`https://wa.me/${site.whatsapp}`} className="text-brand hover:underline">
                  WhatsApp us
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20">
          <h2 className="font-display text-2xl">You may also like</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
