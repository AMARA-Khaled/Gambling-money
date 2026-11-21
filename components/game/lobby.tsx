"use client";

import { useState, useTransition } from "react";
import type { GameState, StatePlayer } from "@/lib/game-types";
import { joinOpenGame } from "@/app/actions/games";
import { JoinQR } from "./qr-code";

export function Lobby({ state }: { state: GameState }) {
  const { game, me, players } = state;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <GameHeader state={state} />

      <div className="mt-5 rounded-2xl border border-border bg-surface/50 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Players{" "}
            <span className="text-muted">({players.length})</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
            Lobby
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {players.map((p) => (
            <PlayerRow key={p.id} player={p} isHost={p.userId === game.createdBy} isMe={p.userId === me.userId} />
          ))}
        </ul>
      </div>

      {game.joinMode === "code" && game.joinCode && (
        <InvitePanel code={game.joinCode} />
      )}

      {!me.isPlayer && game.joinMode === "open" && (
        <JoinOpenButton gameId={game.id} />
      )}
      {!me.isPlayer && game.joinMode === "code" && (
        <p className="mt-5 text-center text-sm text-muted">
          You&apos;re viewing this game. Ask the host for the code to join.
        </p>
      )}

      {me.isHost && (
        <p className="mt-6 text-center text-xs text-faint">
          You&apos;re the host. Live play starts in the next update — gather
          everyone in the meantime.
        </p>
      )}
    </div>
  );
}

function GameHeader({ state }: { state: GameState }) {
  const { game } = state;
  const config =
    game.type === "poker"
      ? `Blinds ${game.smallBlind}/${game.bigBlind}`
      : `Min bet ${game.minBet}`;
  return (
    <div className="felt rounded-2xl border border-border-strong bg-surface p-5">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-medium text-primary">
          {game.type === "poker" ? "♠ Poker" : "♦ Blackjack"}
        </span>
        <span>·</span>
        <span className="tabular">{config}</span>
      </div>
      <p className="mt-3 text-sm text-muted">Starting stack</p>
      <p className="tabular text-3xl font-bold text-gold">
        {game.startingStack.toLocaleString()}
      </p>
    </div>
  );
}

function PlayerRow({
  player,
  isHost,
  isMe,
}: {
  player: StatePlayer;
  isHost: boolean;
  isMe: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-surface-2/60 px-3 py-2.5">
      {player.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.image} alt="" className="h-8 w-8 rounded-full" />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-3 text-sm">
          {(player.name ?? "?").charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {player.name ?? "Player"}
          {isMe && <span className="ml-1 text-xs text-faint">(you)</span>}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {isHost && <Badge>Host</Badge>}
        {player.isDealer && <Badge tone="gold">Dealer</Badge>}
      </div>
    </li>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "gold";
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        tone === "gold"
          ? "bg-gold/15 text-gold"
          : "bg-primary/15 text-primary"
      }`}
    >
      {children}
    </span>
  );
}

function InvitePanel({ code }: { code: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface/50 p-5">
      <h2 className="text-sm font-semibold">Invite players</h2>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-xs text-faint">Join code</p>
          <p className="tabular text-3xl font-bold tracking-[0.2em] text-foreground">
            {code}
          </p>
          <div className="mt-3 flex gap-2">
            <CopyButton label="Copy code" value={code} />
            <CopyLinkButton code={code} />
          </div>
        </div>
        <JoinQR code={code} />
      </div>
    </div>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-border-strong"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          const url = `${window.location.origin}/join?code=${code}`;
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-border-strong"
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}

function JoinOpenButton({ gameId }: { gameId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-5">
      <button
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await joinOpenGame(gameId);
            if (res?.error) setError(res.error);
          });
        }}
        disabled={pending}
        className="w-full rounded-full bg-primary py-3.5 font-semibold text-primary-fg transition hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join this game"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-loss">{error}</p>}
    </div>
  );
}
