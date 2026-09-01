"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/site/cart-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image?: string;
    customizable: boolean;
    customNote: string | null;
    stock: number;
  };
};

export function AddToCart({ product }: Props) {
  const { add } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [customText, setCustomText] = React.useState("");
  const [customImageUrl, setCustomImageUrl] = React.useState("");
  const [added, setAdded] = React.useState(false);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity,
      customText: customText.trim() || undefined,
      customImageUrl: customImageUrl.trim() || undefined,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mt-8 space-y-5">
      {product.customizable ? (
        <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-medium">Personalise it</p>
          <Field
            label="Name, date or message to print"
            hint={product.customNote ?? "Exactly as you want it to appear on the piece."}
          >
            <Textarea
              value={customText}
              onChange={(event) => setCustomText(event.target.value)}
              maxLength={300}
              placeholder="e.g. Aarav & Diya · 14.02.2026"
            />
          </Field>
          <Field
            label="Reference photo link (optional)"
            hint="Paste a Google Drive / WhatsApp / Instagram link, or send it after checkout."
          >
            <Input
              value={customImageUrl}
              onChange={(event) => setCustomImageUrl(event.target.value)}
              placeholder="https://…"
            />
          </Field>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 items-center rounded-full border border-line bg-white">
          <button
            className="px-4 text-lg text-muted hover:text-brand"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            className="px-4 text-lg text-muted hover:text-brand"
            onClick={() => setQuantity((value) => Math.min(99, value + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <Button size="lg" onClick={handleAdd} disabled={outOfStock}>
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {outOfStock ? "Out of stock" : added ? "Added to bag" : "Add to bag"}
        </Button>

        <Link href="/cart">
          <Button size="lg" variant="outline">
            Go to bag
          </Button>
        </Link>
      </div>
    </div>
  );
}
