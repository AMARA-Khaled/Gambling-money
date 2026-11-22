import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { JoinForm } from "@/components/join-form";
import { SignInToContinue } from "@/components/sign-in-to-continue";

export default function JoinPage({ searchParams }: PageProps<"/join">) {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-10">
      <Link href="/dashboard" className="text-xs text-muted hover:text-foreground">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Join a game</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the code your host shared, or scan their QR.
      </p>
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="h-40 animate-pulse-slow rounded-2xl bg-surface-2" />
          }
        >
          <Gate searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Gate({
  searchParams,
}: {
  searchParams: PageProps<"/join">["searchParams"];
}) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code : "";

  const user = await getCurrentUser();
  if (!user?.id) {
    const callbackUrl = initialCode
      ? `/join?code=${encodeURIComponent(initialCode)}`
      : "/join";
    return (
      <SignInToContinue
        callbackUrl={callbackUrl}
        title="Sign in to join"
        subtitle="Sign in with Google and we'll drop you straight into the game."
      />
    );
  }

  return <JoinForm initialCode={initialCode} />;
}
