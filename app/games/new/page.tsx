import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { NewGameForm } from "@/components/new-game-form";

export default function NewGamePage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <Link href="/dashboard" className="text-xs text-muted hover:text-foreground">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">New game</h1>
      <p className="mt-1 text-sm text-muted">
        Set the table. You&apos;ll be the host.
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-96 animate-pulse-slow rounded-2xl bg-surface-2" />
          }
        >
          <Gate />
        </Suspense>
      </div>
    </div>
  );
}

async function Gate() {
  await requireUser();
  return <NewGameForm />;
}
