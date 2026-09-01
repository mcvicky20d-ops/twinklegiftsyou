"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string };

export async function authenticate(_previous: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: String(formData.get("callbackUrl") || "/admin"),
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Those details did not match. Please try again." };
    }
    // next-auth signals a successful redirect by throwing, so let it through.
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
