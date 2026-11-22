"use server";

import { signIn, signOut } from "@/auth";

/** Only allow internal, same-origin redirect targets. */
function safeInternalPath(value: unknown): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return "/dashboard";
}

export async function signInWithGoogle(formData?: FormData) {
  const callbackUrl = safeInternalPath(formData?.get("callbackUrl"));
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
