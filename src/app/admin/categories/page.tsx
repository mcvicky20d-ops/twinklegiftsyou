import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategory, saveCategory } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          The groups shown on the home page and the shop filter bar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center text-sm text-muted">
              No categories yet — add one on the right.
            </div>
          ) : (
            categories.map((category) => (
              <form
                key={category.id}
                action={saveCategory}
                className="space-y-4 rounded-2xl border border-line bg-white p-5"
              >
                <input type="hidden" name="id" value={category.id} />
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg">{category.name}</p>
                  <span className="text-xs text-muted">
                    {category._count.products} product{category._count.products === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <Input name="name" defaultValue={category.name} required />
                  </Field>
                  <Field label="Slug">
                    <Input name="slug" defaultValue={category.slug} />
                  </Field>
                </div>
                <Field label="Description">
                  <Input name="description" defaultValue={category.description ?? ""} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <Field label="Cover image URL">
                    <Input name="image" defaultValue={category.image ?? ""} />
                  </Field>
                  <Field label="Order">
                    <Input name="sortOrder" type="number" defaultValue={category.sortOrder} />
                  </Field>
                </div>

                <div className="flex items-center justify-between">
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <DeleteButton
                    action={deleteCategory}
                    id={category.id}
                    confirmText={`Delete “${category.name}”? Its ${category._count.products} product(s) will be deleted too.`}
                  />
                </div>
              </form>
            ))
          )}
        </div>

        <form action={saveCategory} className="h-fit space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg">Add a category</h2>
          <Field label="Name">
            <Input name="name" required placeholder="Pencil Art" />
          </Field>
          <Field label="Description">
            <Textarea name="description" placeholder="Hand-drawn portraits on A4 and A3 paper" />
          </Field>
          <Field label="Cover image URL">
            <Input name="image" placeholder="https://…" />
          </Field>
          <Field label="Sort order">
            <Input name="sortOrder" type="number" defaultValue={0} />
          </Field>
          <Button type="submit" className="w-full">
            Create category
          </Button>
        </form>
      </div>
    </div>
  );
}
