import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";

/**
 * Data Access Layer — the single place the app reads the session.
 * Reads cookies, so callers must sit behind a <Suspense> boundary
 * (Cache Components) or in a Server Action / Route Handler.
 */

export const getSession = cache(async () => {
  // next-auth's auth() uses crypto before its cookie read, which trips the
  // Cache Components prerender. Opt into request-time rendering up front so
  // these reads always stream behind their <Suspense> boundary.
  await connection();
  return auth();
});

/** Returns the current user or null (does not redirect). */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});

/** Returns the current user or redirects to the landing page to sign in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect("/");
  }
  return user;
}
