import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { ProductCard } from "@/components/site/product-card";
import { absolute, breadcrumbSchema, canonical, jsonLdGraph } from "@/lib/seo";
import { site } from "@/lib/site";

export const revalidate = 300;

/**
 * A filter on the shop page cannot rank — `?category=` reads as one page to a
 * crawler. These give each craft its own indexable URL, title and copy, which
 * is what someone searching "customised mugs online india" actually lands on.
 */
async function getCategory(slug: string) {
  return safeQuery(
    () =>
      prisma.category.findUnique({
        where: { slug },
        include: {
          products: {
            where: { isActive: true },
            include: { category: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    null,
  );
}

export async function generateStaticParams() {
  const categories = await safeQuery(
    () => prisma.category.findMany({ select: { slug: true } }),
    [] as { slug: string }[],
  );
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Collection not found" };

  const title = `${category.name} Online in India — Made to Order`;
  const description =
    category.description ??
    `Shop handmade ${category.name.toLowerCase()} from ${site.name}. Personalised to order and delivered across India.`;

  return {
    title,
    description,
    ...canonical(`/collections/${category.slug}`),
    openGraph: {
      title: `${title} · ${site.name}`,
      description,
      url: absolute(`/collections/${category.slug}`),
      type: "website",
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/products" },
              { name: category.name, path: `/collections/${category.slug}` },
            ]),
          ),
        }}
      />

      <nav className="text-sm text-muted">
        <Link href="/products" className="hover:text-brand">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span>{category.name}</span>
      </nav>

      <h1 className="mt-4 font-display text-4xl">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        {category.description ??
          `Handmade ${category.name.toLowerCase()}, personalised to your photo or message.`}{" "}
        Every piece is made to order and shipped anywhere in India, padded and gift-wrapped.
      </p>

      {category.products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="font-display text-xl">Nothing in this collection yet</p>
          <Link href="/products" className="mt-4 inline-block text-sm text-brand hover:underline">
            Browse everything
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-2xl">Ordering {category.name.toLowerCase()}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Pick a piece, add the name, date or message you want on it, and send us the photograph
          you would like us to work from. We share a preview before anything ships, so nothing
          reaches you as a surprise. Delivery runs 5–7 working days for personalised items,
          anywhere from Chennai to Delhi to the North East.
        </p>
      </section>
    </div>
  );
}
