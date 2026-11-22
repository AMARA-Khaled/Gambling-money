"use client";

import type { GameState, StatePlayer } from "@/lib/game-types";

export function GameTable({ state }: { state: GameState }) {
  const { game, players } = state;
  const config =
    game.type === "poker"
      ? `Blinds ${game.smallBlind}/${game.bigBlind}`
      : `Min bet ${game.minBet}`;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="felt rounded-2xl border border-border-strong bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-medium text-primary">
              {game.type === "poker" ? "♠ Poker" : "♦ Blackjack"}
            </span>
            <span className="tabular">{config}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
            In play
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {players.map((p) => (
          <SeatRow
            key={p.id}
            player={p}
            isHost={p.userId === game.createdBy}
            isMe={p.userId === state.me.userId}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-faint">
        Round controls land in the next update. Stacks above update live as
        hands are recorded.
      </p>
    </div>
  );
}

function SeatRow({
  player,
  isHost,
  isMe,
}: {
  player: StatePlayer;
  isHost: boolean;
  isMe: boolean;
}) {
  const busted = player.stack <= 0;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
        busted
          ? "border-border/50 bg-surface/30 opacity-60"
          : "border-border bg-surface-2/50"
      }`}
    >
      {player.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.image} alt="" className="h-9 w-9 rounded-full" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-sm">
          {(player.name ?? "?").charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {player.name ?? "Player"}
          {isMe && <span className="ml-1 text-xs text-faint">(you)</span>}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {isHost && (
            <span className="text-[10px] font-semibold uppercase text-primary">
              host
            </span>
          )}
          {player.isDealer && (
            <span className="text-[10px] font-semibold uppercase text-gold">
              dealer
            </span>
          )}
          {player.status === "sitting_out" && (
            <span className="text-[10px] font-semibold uppercase text-muted">
              sitting out
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="tabular text-lg font-bold text-gold">
          {player.stack.toLocaleString()}
        </p>
        <p
          className={`tabular text-xs ${
            player.net >= 0 ? "text-win" : "text-loss"
          }`}
        >
          {player.net >= 0 ? "+" : ""}
          {player.net.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
