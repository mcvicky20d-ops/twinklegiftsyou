import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProduct } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted">{products.length} in the catalogue</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4" /> New product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="font-display text-xl">No products yet</p>
          <p className="mt-2 text-sm text-muted">
            Add a category first, then create your first product.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-3xl text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-cream">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-blush">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-brand">
                        {product.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{product.category.name}</td>
                  <td className="px-5 py-3">{formatPrice(product.price)}</td>
                  <td className="px-5 py-3">{product.stock}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <Badge tone={product.isActive ? "green" : "neutral"}>
                        {product.isActive ? "Live" : "Hidden"}
                      </Badge>
                      {product.isFeatured ? <Badge tone="brand">Featured</Badge> : null}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={deleteProduct}>
                      <DeleteButton
                        action={deleteProduct}
                        id={product.id}
                        confirmText={`Delete “${product.title}”?`}
                      />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
