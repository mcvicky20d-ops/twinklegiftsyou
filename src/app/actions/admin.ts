"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rupeesToPaise, slugify } from "@/lib/utils";
import type { EnquiryStatus, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export type FormState = { status: "idle" | "error" | "success"; message?: string };

const optionalNumber = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
};

const productForm = z.object({
  title: z.string().min(2, "Title is too short").max(140),
  slug: z.string().max(160).optional(),
  description: z.string().min(10, "Add a longer description"),
  price: z.number().min(0, "Price must be positive"),
  comparePrice: z.number().min(0).nullable(),
  categoryId: z.string().min(1, "Pick a category"),
  images: z.array(z.string()).max(6),
  stock: z.number().int().min(0),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  customizable: z.boolean(),
  customNote: z.string().max(200).nullable(),
  customisationModes: z
    .array(z.enum(["TEXT_ONLY", "IMAGE_ONLY", "TEXT_AND_IMAGE"]))
    .min(1, "Pick at least one personalisation option"),
});

function readProductForm(formData: FormData) {
  return productForm.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: Number(formData.get("price") ?? 0),
    comparePrice: optionalNumber(formData.get("comparePrice")),
    categoryId: String(formData.get("categoryId") ?? ""),
    images: String(formData.get("images") ?? "")
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean),
    stock: Number(formData.get("stock") ?? 0),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    customizable: formData.get("customizable") === "on",
    customNote: String(formData.get("customNote") ?? "").trim() || null,
    customisationModes: formData.getAll("customisationModes").map(String),
  });
}

/** Keeps appending -2, -3… until the slug is free. */
async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "item";
  let candidate = root;
  let counter = 2;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${root}-${counter++}`;
  }
}

export async function saveProduct(
  productId: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = readProductForm(formData);
  if (!parsed.success) {
    return { status: "error", message: z.prettifyError(parsed.error) };
  }
  const data = parsed.data;

  const payload = {
    title: data.title,
    slug: await uniqueSlug(data.slug || data.title, productId ?? undefined),
    description: data.description,
    price: rupeesToPaise(data.price),
    comparePrice: data.comparePrice === null ? null : rupeesToPaise(data.comparePrice),
    categoryId: data.categoryId,
    images: data.images,
    stock: data.stock,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
    customizable: data.customizable,
    customNote: data.customNote,
    customisationModes: data.customisationModes,
  };

  if (productId) {
    await prisma.product.update({ where: { id: productId }, data: payload });
  } else {
    await prisma.product.create({ data: payload });
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;

  const data = {
    name,
    slug: slugify(String(formData.get("slug") ?? "").trim() || name),
    description: String(formData.get("description") ?? "").trim() || null,
    image: String(formData.get("image") ?? "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function updateOrder(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.order.update({
    where: { id },
    data: {
      status: String(formData.get("status")) as OrderStatus,
      paymentStatus: String(formData.get("paymentStatus")) as PaymentStatus,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateEnquiryStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.enquiry.update({
    where: { id },
    data: { status: String(formData.get("status")) as EnquiryStatus },
  });
  revalidatePath("/admin/enquiries");
}

export async function saveGalleryItem(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!title || !imageUrl) return;

  const data = {
    title,
    imageUrl,
    caption: String(formData.get("caption") ?? "").trim() || null,
    tag: String(formData.get("tag") ?? "Pencil Art").trim(),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  };

  if (id) {
    await prisma.galleryItem.update({ where: { id }, data });
  } else {
    await prisma.galleryItem.create({ data });
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function deleteGalleryItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.galleryItem.delete({ where: { id } });
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function deleteStoredPhoto(formData: FormData) {
  await requireAdmin();

  const path = String(formData.get("path") ?? "");
  if (!path) return;

  const { deletePhoto } = await import("@/lib/storage");
  await deletePhoto(path);
  revalidatePath("/admin/library");
}
