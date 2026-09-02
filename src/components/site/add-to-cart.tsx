"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useCart, type CustomisationMode } from "@/components/site/cart-provider";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { ImageUploadField } from "@/components/site/image-upload-field";
import { customisationOptions, needsImage, needsText } from "@/lib/customisation";
import { cn } from "@/lib/utils";

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
  const [mode, setMode] = React.useState<CustomisationMode>("TEXT_AND_IMAGE");
  const [customText, setCustomText] = React.useState("");
  const [customImageUrl, setCustomImageUrl] = React.useState("");
  const [added, setAdded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const outOfStock = product.stock <= 0;
  const wantsText = product.customizable && needsText(mode);
  const wantsImage = product.customizable && needsImage(mode);

  function handleAdd() {
    // Only the text is required up front. The photo can still arrive by
    // WhatsApp, which the checkout prompt asks about explicitly.
    if (wantsText && !customText.trim()) {
      setError("Please add the text you would like on it.");
      return;
    }
    setError(null);

    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity,
      customisationMode: product.customizable ? mode : "NONE",
      customText: wantsText ? customText.trim() : undefined,
      customImageUrl: wantsImage && customImageUrl ? customImageUrl : undefined,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mt-8 space-y-5">
      {product.customizable ? (
        <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
          <div>
            <p className="text-sm font-medium">How would you like it personalised?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {customisationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  aria-pressed={mode === option.value}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition-colors",
                    mode === option.value
                      ? "border-brand bg-blush"
                      : "border-line hover:border-brand/50",
                  )}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {wantsText ? (
            <Field
              label="Text to print"
              hint={product.customNote ?? "Exactly as you want it to appear."}
            >
              <Textarea
                value={customText}
                onChange={(event) => setCustomText(event.target.value)}
                maxLength={300}
                placeholder="e.g. Aarav & Diya · 14.02.2026"
              />
            </Field>
          ) : null}

          {wantsImage ? (
            <Field label="Your photo">
              <ImageUploadField
                value={customImageUrl}
                onChange={setCustomImageUrl}
                hint="A clear, well-lit photo gives the best result."
              />
            </Field>
          ) : null}
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
