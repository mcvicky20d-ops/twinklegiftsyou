"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveProduct, type FormState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ImageInput } from "@/components/admin/image-input";
import { paiseToRupees } from "@/lib/utils";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  categoryId: string;
  images: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  customizable: boolean;
  customNote: string | null;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: { id: string; name: string }[];
}) {
  const action = saveProduct.bind(null, product?.id ?? null);
  const [state, formAction, pending] = useActionState(action, {
    status: "idle",
  } as FormState);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
        <Field label="Title">
          <Input name="title" defaultValue={product?.title} required />
        </Field>

        <Field label="URL slug" hint="Leave blank to build it from the title.">
          <Input name="slug" defaultValue={product?.slug} placeholder="pencil-portrait-a4" />
        </Field>

        <Field label="Description">
          <Textarea
            name="description"
            defaultValue={product?.description}
            required
            className="min-h-44"
            placeholder="Size, paper, framing options, turnaround time…"
          />
        </Field>

        <Field label="Images" hint="First image is used as the thumbnail.">
          <ImageInput name="images" defaultValue={product?.images ?? []} />
        </Field>
      </div>

      <div className="space-y-5">
        <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
          <Field label="Category">
            <Select name="categoryId" defaultValue={product?.categoryId} required>
              <option value="">Select…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Price (₹)">
            <Input
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={product ? paiseToRupees(product.price) : ""}
            />
          </Field>

          <Field label="Compare-at price (₹)" hint="Shown struck through. Optional.">
            <Input
              name="comparePrice"
              type="number"
              min={0}
              step="0.01"
              defaultValue={
                product?.comparePrice != null ? paiseToRupees(product.comparePrice) : ""
              }
            />
          </Field>

          <Field label="Stock">
            <Input name="stock" type="number" min={0} defaultValue={product?.stock ?? 10} />
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-line bg-white p-6 text-sm">
          <label className="flex items-center gap-3">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} />
            Visible on the shop
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} />
            Feature on the home page
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="customizable"
              defaultChecked={product?.customizable ?? true}
            />
            Ask the buyer for personalisation
          </label>

          <Field label="Personalisation hint">
            <Input
              name="customNote"
              defaultValue={product?.customNote ?? ""}
              placeholder="e.g. Send a clear, well-lit photo"
            />
          </Field>
        </div>

        {state.status === "error" ? (
          <p className="whitespace-pre-line rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </Button>
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </form>
  );
}
