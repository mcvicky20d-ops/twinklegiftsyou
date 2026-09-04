import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export type ProductCardData = {
  slug: string;
  title: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  shippingFee?: number;
  category: { name: string } | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-blush">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-brand/40">
            {product.title.charAt(0)}
          </div>
        )}
        {discount ? (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
            {discount}% off
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category ? (
          <p className="text-xs uppercase tracking-wide text-muted">{product.category.name}</p>
        ) : null}
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-ink group-hover:text-brand">
          {product.title}
        </h3>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg">{formatPrice(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price ? (
              <span className="text-xs text-muted line-through">
                {formatPrice(product.comparePrice)}
              </span>
            ) : null}
          </div>
          {typeof product.shippingFee === "number" ? (
            <p className="mt-0.5 text-xs text-muted">
              + {formatPrice(product.shippingFee)} delivery
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
