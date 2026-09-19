"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string };

export async function authenticate(_previous: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: String(formData.get("callbackUrl") || "/account"),
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

/** Hands off to Google. The provider only exists when its keys are set. */
export async function signInWithGoogle(formData: FormData) {
  await signIn("google", {
    redirectTo: String(formData.get("callbackUrl") || "/account"),
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/** Staff sign-out lands back on the sign-in screen rather than the shop. */
export async function signOutAdminAction() {
  await signOut({ redirectTo: "/login" });
}
