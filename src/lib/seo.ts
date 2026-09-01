import type { Metadata } from "next";
import { real, site } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";

/** Absolute URL for a path — schema.org and canonical tags both need absolute. */
export function absolute(path = "/") {
  return new URL(path, siteUrl()).toString();
}

/**
 * Every indexable page declares its own canonical. Without one, `/products`,
 * `/products?category=pencil-art` and the www/apex variants all read as
 * separate pages competing for the same terms.
 */
export function canonical(path: string): Metadata {
  return { alternates: { canonical: absolute(path) } };
}

/** Pages that must never reach an index: cart, checkout, order receipts, admin. */
export const noIndex: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

type JsonLd = Record<string, unknown>;

export function organizationSchema(): JsonLd {
  const sameAs = [real(site.instagram)].filter(Boolean);

  return {
    "@type": "Organization",
    "@id": absolute("/#organization"),
    name: site.name,
    url: absolute("/"),
    description: site.description,
    ...(sameAs.length ? { sameAs } : {}),
    // The shop ships nationwide rather than serving one city, which is what
    // "selling all over India" needs to say to a search engine.
    areaServed: { "@type": "Country", name: "India" },
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: site.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: site.email,
      ...(real(site.phone) ? { telephone: real(site.phone) } : {}),
      areaServed: "IN",
      availableLanguage: ["en", "ta", "hi"],
    },
  };
}

export function webSiteSchema(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": absolute("/#website"),
    url: absolute("/"),
    name: site.name,
    description: site.description,
    inLanguage: "en-IN",
    publisher: { "@id": absolute("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absolute("/products?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

export function productSchema(product: {
  title: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  categoryName: string;
}): JsonLd {
  return {
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.length ? product.images : undefined,
    category: product.categoryName,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: absolute(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": absolute("/#organization") },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          // Made to order, so the handling window is the honest part of the wait.
          handlingTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" },
        },
      },
    },
  };
}

/** Wraps schema nodes in the single @graph block a page should emit. */
export function jsonLdGraph(...nodes: JsonLd[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}
