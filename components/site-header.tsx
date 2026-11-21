import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { SignOutButton } from "@/components/sign-out-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-fg font-black">
            ♠
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Drahem <span className="text-primary">L7ram</span>
          </span>
        </Link>
        <Suspense fallback={<div className="h-7 w-20" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="hidden text-xs font-medium text-muted transition hover:text-foreground sm:block"
      >
        Dashboard
      </Link>
      <div className="flex items-center gap-2">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-7 w-7 rounded-full border border-border"
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-xs">
            {(user.name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
