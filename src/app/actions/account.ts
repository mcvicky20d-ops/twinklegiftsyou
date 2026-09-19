"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, signIn } from "@/lib/auth";
import { addressSchema, registerSchema } from "@/lib/validators";
import { newAddressReference } from "@/lib/utils";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
};

function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    (result[field] ??= []).push(issue.message);
  }
  return result;
}

/** Creates a customer account and signs them straight in. */
export async function register(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the fields marked in red.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    return {
      error: "That email already has an account. Sign in instead.",
      fieldErrors: { email: ["Already registered"] },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  if (existing) {
    // Registered with Google first, now adding a password: keep the one
    // account rather than failing on the unique email.
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, phone: parsed.data.phone || existing.phone },
    });
  } else {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone || null,
        passwordHash,
        role: "CUSTOMER",
      },
    });
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: String(formData.get("callbackUrl") || "/account"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please sign in." };
    }
    // next-auth signals a successful redirect by throwing, so let it through.
    throw error;
  }

  return { ok: true };
}

function readAddress(formData: FormData) {
  return addressSchema.safeParse({
    label: String(formData.get("label") || "Home"),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: String(formData.get("addressLine2") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    pincode: String(formData.get("pincode") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  });
}

export async function saveAddress(_previous: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = readAddress(formData);
  if (!parsed.success) {
    return {
      error: "Please correct the fields marked in red.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const id = String(formData.get("id") ?? "");
  const { isDefault, addressLine2, ...rest } = parsed.data;
  const data = { ...rest, addressLine2: addressLine2 || null, isDefault: Boolean(isDefault) };

  // The first address a customer saves is their default whether they ticked
  // the box or not — otherwise checkout has nothing to preselect.
  const count = await prisma.address.count({ where: { userId: user.id } });
  const makeDefault = data.isDefault || count === 0;

  let savedId: string;
  if (id) {
    // Scoped by userId so a guessed id cannot reach someone else's address.
    const owned = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!owned) return { error: "That address no longer exists." };
    await prisma.address.update({
      where: { id: owned.id },
      data: { ...data, isDefault: makeDefault },
    });
    savedId = owned.id;
  } else {
    const created = await prisma.address.create({
      data: { ...data, isDefault: makeDefault, userId: user.id, reference: newAddressReference() },
    });
    savedId = created.id;
  }

  // Exactly one default per customer.
  if (makeDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, id: { not: savedId } },
      data: { isDefault: false },
    });
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function deleteAddress(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.address.deleteMany({ where: { id, userId: user.id } });

  // Never leave the book without a default, or checkout preselects nothing.
  const remaining = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (remaining.length > 0 && !remaining.some((address) => address.isDefault)) {
    await prisma.address.update({
      where: { id: remaining[0].id },
      data: { isDefault: true },
    });
  }

  revalidatePath("/account/addresses");
}

export async function makeDefaultAddress(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const owned = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return;

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: owned.id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/account/addresses");
}

export async function updateProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().min(2, "Please enter your name").max(80),
      phone: z
        .union([z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"), z.literal("")])
        .optional(),
    })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });

  if (!parsed.success) {
    return { error: "Please correct the fields marked in red.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });

  revalidatePath("/account");
  return { ok: true };
}
