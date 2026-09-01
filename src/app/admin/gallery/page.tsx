import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ImageInput } from "@/components/admin/image-input";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteGalleryItem, saveGalleryItem } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const tags = ["Pencil Art", "Customised Mugs", "Photo Frames", "Gift Hampers"];

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Gallery</h1>
        <p className="mt-1 text-sm text-muted">Finished work shown on the public gallery page.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center text-sm text-muted">
              Nothing in the gallery yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <div className="relative aspect-4/3 bg-blush">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">{item.tag}</p>
                    <p className="mt-1 font-medium">{item.title}</p>
                    {item.caption ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{item.caption}</p>
                    ) : null}
                    <form action={deleteGalleryItem} className="mt-3 flex justify-end">
                      <DeleteButton
                        action={deleteGalleryItem}
                        id={item.id}
                        confirmText={`Remove “${item.title}” from the gallery?`}
                      />
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          action={saveGalleryItem}
          className="h-fit space-y-4 rounded-2xl border border-line bg-white p-5"
        >
          <h2 className="font-display text-lg">Add to gallery</h2>
          <Field label="Title">
            <Input name="title" required placeholder="Family portrait, A3" />
          </Field>
          <Field label="Image">
            <ImageInput name="imageUrl" max={1} />
          </Field>
          <Field label="Caption">
            <Input name="caption" placeholder="Graphite on 300gsm paper" />
          </Field>
          <Field label="Tag">
            <Select name="tag" defaultValue={tags[0]}>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort order">
            <Input name="sortOrder" type="number" defaultValue={0} />
          </Field>
          <Button type="submit" className="w-full">
            Add item
          </Button>
        </form>
      </div>
    </div>
  );
}
