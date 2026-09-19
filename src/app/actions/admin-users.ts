"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UserFormState = {
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

const phoneRule = z
  .union([z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"), z.literal("")])
  .optional();

const createSchema = z.object({
  name: z.string().min(2, "Please enter a name").max(80),
  email: z.string().email("Enter a valid email"),
  phone: phoneRule,
  role: z.enum(["ADMIN", "CUSTOMER"]),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

const updateSchema = z.object({
  name: z.string().min(2, "Please enter a name").max(80),
  phone: phoneRule,
  role: z.enum(["ADMIN", "CUSTOMER"]),
  // Blank means "leave the current password alone".
  password: z.union([z.string().min(8, "Use at least 8 characters").max(72), z.literal("")]),
});

/** Create — an account made by staff, e.g. a second admin. */
export async function createUser(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    role: String(formData.get("role") ?? "CUSTOMER"),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Please correct the fields in red.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "That email already has an account.", fieldErrors: { email: ["Already taken"] } };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
  });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}`);
}

/** Update — name, phone, role, and optionally a new password. */
export async function updateUser(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "That account no longer exists." };

  const parsed = updateSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    role: String(formData.get("role") ?? "CUSTOMER"),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Please correct the fields in red.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  // Never let the panel lock itself out: the last admin keeps their role, and
  // nobody demotes themselves by accident mid-session.
  if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    if (target.id === session.user.id) {
      return { error: "You cannot remove your own admin access." };
    }
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return { error: "This is the only admin account — promote another one first." };
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      ...(parsed.data.password
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 12) }
        : {}),
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { ok: true };
}

/**
 * Delete — removes the account, its sign-in methods and its saved addresses.
 * Orders are deliberately kept: they are the shop's business record, and the
 * schema detaches them (userId becomes null) rather than deleting them.
 */
export async function deleteUser(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return;

  if (target.id === session.user.id) {
    throw new Error("You cannot delete the account you are signed in with.");
  }
  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw new Error("This is the only admin account.");
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/admin/users");
  redirect("/admin/users?deleted=1");
}

/** Turns down a closure request without deleting the account. */
export async function dismissDeletionRequest(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.user.update({
    where: { id },
    data: { deletionRequestedAt: null, deletionReason: null },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

/** Customer-side: asks us to close the account. Staff do the deleting. */
export async function requestAccountDeletion(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const user = await requireUser();

  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const confirmation = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirmation !== "DELETE") {
    return {
      error: "Type DELETE in the box to confirm.",
      fieldErrors: { confirm: ["Type DELETE to confirm"] },
    };
  }

  // An admin closing their own account would lock the panel; ask them to use
  // the user list instead, where the last-admin check lives.
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (record?.role === "ADMIN") {
    return { error: "Admin accounts are closed from the admin panel." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { deletionRequestedAt: new Date(), deletionReason: reason || null },
  });

  revalidatePath("/account");
  return { ok: true };
}

/** Customer-side: changed their mind. */
export async function cancelAccountDeletion() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { deletionRequestedAt: null, deletionReason: null },
  });
  revalidatePath("/account");
}
