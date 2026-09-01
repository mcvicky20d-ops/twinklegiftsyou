"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/site/cart-provider";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_ABOVE, shippingFor } from "@/lib/pricing";

export default function CartPage() {
  const { items, subtotal, ready, updateQuantity, remove } = useCart();
  const shipping = shippingFor(subtotal);

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-sm text-muted">Loading your bag…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted">Pick something lovely and it will show up here.</p>
        <Link href="/products" className="mt-8 inline-block">
          <Button size="lg">Browse the shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Your bag</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li
              key={`${item.productId}-${index}`}
              className="flex gap-4 rounded-2xl border border-line bg-white p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-blush">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                ) : null}
              </div>

              <div className="flex-1">
                <Link href={`/products/${item.slug}`} className="font-medium hover:text-brand">
                  {item.title}
                </Link>
                <p className="mt-0.5 text-sm text-muted">{formatPrice(item.price)} each</p>
                {item.customText ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    Personalisation: “{item.customText}”
                  </p>
                ) : null}
                {item.customImageUrl ? (
                  <p className="mt-0.5 truncate text-xs text-muted">Photo: {item.customImageUrl}</p>
                ) : null}

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-9 items-center rounded-full border border-line">
                    <button
                      className="px-3 text-muted hover:text-brand"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <button
                      className="px-3 text-muted hover:text-brand"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-600"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>

              <p className="font-display text-lg">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPrice(subtotal + shipping)}</dd>
            </div>
          </dl>

          {shipping > 0 ? (
            <p className="mt-3 text-xs text-muted">
              Add {formatPrice(FREE_SHIPPING_ABOVE - subtotal)} more for free shipping.
            </p>
          ) : null}

          <Link href="/checkout" className="mt-6 block">
            <Button size="lg" className="w-full">
              Checkout
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
