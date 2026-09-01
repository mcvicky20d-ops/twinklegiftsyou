import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
        <p className="font-display text-xl">Add a category first</p>
        <p className="mt-2 text-sm text-muted">
          Products need a category — try “Pencil Art”, “Customised Mugs” or “Photo Frames”.
        </p>
        <Link href="/admin/categories" className="mt-4 inline-block text-sm text-brand hover:underline">
          Go to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
