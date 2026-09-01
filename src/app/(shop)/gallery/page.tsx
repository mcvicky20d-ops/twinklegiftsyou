import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { Badge } from "@/components/ui/badge";
import { canonical } from "@/lib/seo";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Gallery — Pencil Portraits, Mugs & Frames We Have Made",
  description:
    "Real commissions: hand-drawn pencil portraits, customised mugs and personalised photo frames made for customers across India.",
  ...canonical("/gallery"),
};

export default async function GalleryPage() {
  const items = await safeQuery(
    () =>
      prisma.galleryItem.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    [],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Gallery</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Real pieces, real people. Every sketch here started as a photograph someone sent us on
        WhatsApp.
      </p>

      {items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="font-display text-xl">The gallery is empty</p>
          <p className="mt-2 text-sm text-muted">Add your work from the admin panel.</p>
        </div>
      ) : (
        <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <figure
              key={item.id}
              className="mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-line bg-white"
            >
              <div className="relative aspect-4/5 bg-blush">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-4">
                <Badge tone="brand">{item.tag}</Badge>
                <p className="mt-2 font-medium">{item.title}</p>
                {item.caption ? <p className="mt-1 text-sm text-muted">{item.caption}</p> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
