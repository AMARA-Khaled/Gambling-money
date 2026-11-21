import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { SignInButton } from "@/components/sign-in-button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
          Fake money · real bragging rights
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Your crew&apos;s <span className="text-primary">poker</span> &{" "}
          <span className="text-gold">blackjack</span> bank.
        </h1>

        <p className="mx-auto mt-5 max-w-md text-pretty text-muted">
          Deal the cards for real. Let the app handle the chips — live betting,
          side pots, buy-ins, and a lifetime leaderboard that never forgets who
          busted.
        </p>

        <div className="mt-9 flex flex-col items-center gap-4">
          <Suspense
            fallback={
              <div className="h-[52px] w-56 rounded-full bg-surface-2 animate-pulse-slow" />
            }
          >
            <HeroCta />
          </Suspense>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
          <Feature title="Live chip tracking" body="Every bet, call, and all-in moves the money in real time." />
          <Feature title="Join by code or QR" body="Spin up a table, friends scan in. No setup." />
          <Feature title="Lifetime stats" body="Net winnings across every night, ranked." />
        </div>
      </div>
    </div>
  );
}

async function HeroCta() {
  const user = await getCurrentUser();
  if (user?.id) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-fg shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
      >
        Enter the tables →
      </Link>
    );
  }
  return (
    <>
      <SignInButton large />
      <p className="text-xs text-faint">Sign in to create or join a game.</p>
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}
