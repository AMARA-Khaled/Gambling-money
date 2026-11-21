import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getUserGames, type UserGameSummary } from "@/lib/games";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const user = await requireUser();
  const firstName = (user.name ?? "player").split(" ")[0];
  const allGames = await getUserGames(user.id);
  const liveGames = allGames.filter((g) => g.status !== "ended");
  const endedGames = allGames.filter((g) => g.status === "ended");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-faint">
            Welcome back
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{firstName}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/join"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-border-strong"
          >
            Join a game
          </Link>
          <Link
            href="/games/new"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg transition hover:bg-primary-dark"
          >
            + New game
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-surface/50 p-5">
          <h2 className="text-sm font-semibold">Live & lobby</h2>
          {liveGames.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted">
              No active games. Start one and deal the first hand.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {liveGames.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </ul>
          )}

          {endedGames.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-faint">
                Past games
              </h3>
              <ul className="mt-3 space-y-2">
                {endedGames.slice(0, 8).map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-surface/50 p-5">
          <h2 className="text-sm font-semibold">Leaderboard</h2>
          <p className="mt-6 text-center text-sm text-muted">
            Lifetime standings land once games start finishing.
          </p>
        </section>
      </div>
    </>
  );
}

function GameCard({ game }: { game: UserGameSummary }) {
  const statusTone =
    game.status === "active"
      ? "bg-primary/15 text-primary"
      : game.status === "lobby"
        ? "bg-info/15 text-info"
        : "bg-surface-3 text-muted";
  return (
    <li>
      <Link
        href={`/games/${game.id}`}
        className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3.5 py-3 transition hover:border-border-strong"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-lg">
          {game.type === "poker" ? "♠" : "♦"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium capitalize">
            {game.type}
            {game.isHost && (
              <span className="ml-2 text-[10px] font-semibold uppercase text-primary">
                host
              </span>
            )}
          </p>
          <p className="text-xs text-muted">
            {game.playerCount} player{game.playerCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone}`}
          >
            {game.status}
          </span>
          {game.status === "ended" && (
            <p
              className={`tabular mt-1 text-sm font-semibold ${
                game.net >= 0 ? "text-win" : "text-loss"
              }`}
            >
              {game.net >= 0 ? "+" : ""}
              {game.net.toLocaleString()}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse-slow space-y-8">
      <div className="h-10 w-40 rounded-lg bg-surface-2" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-48 rounded-2xl bg-surface-2 lg:col-span-2" />
        <div className="h-48 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
