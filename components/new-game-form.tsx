"use client";

import { useState, useTransition } from "react";
import { createGame } from "@/app/actions/games";

type GameType = "poker" | "blackjack";
type JoinMode = "open" | "code";

export function NewGameForm() {
  const [type, setType] = useState<GameType>("poker");
  const [joinMode, setJoinMode] = useState<JoinMode>("code");
  const [startingStack, setStartingStack] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(5);
  const [bigBlind, setBigBlind] = useState(10);
  const [minBet, setMinBet] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createGame({
        type,
        joinMode,
        startingStack,
        ...(type === "poker" ? { smallBlind, bigBlind } : { minBet }),
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <Field label="Game">
        <Segmented
          value={type}
          onChange={(v) => setType(v as GameType)}
          options={[
            { value: "poker", label: "♠ Poker", sub: "No-Limit Hold'em" },
            { value: "blackjack", label: "♦ Blackjack", sub: "vs dealer" },
          ]}
        />
      </Field>

      <Field label="Starting stack" hint="Chips each player buys in with.">
        <NumberInput value={startingStack} onChange={setStartingStack} min={1} step={50} />
      </Field>

      {type === "poker" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Small blind">
            <NumberInput value={smallBlind} onChange={setSmallBlind} min={1} />
          </Field>
          <Field label="Big blind">
            <NumberInput value={bigBlind} onChange={setBigBlind} min={1} />
          </Field>
        </div>
      ) : (
        <Field label="Minimum bet" hint="Smallest bet a player can place per round.">
          <NumberInput value={minBet} onChange={setMinBet} min={1} />
        </Field>
      )}

      <Field label="How players join">
        <Segmented
          value={joinMode}
          onChange={(v) => setJoinMode(v as JoinMode)}
          options={[
            { value: "code", label: "Code + QR", sub: "share to join" },
            { value: "open", label: "Open", sub: "anyone signed in" },
          ]}
        />
      </Field>

      {error && (
        <p className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={pending}
        className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-fg transition hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create game"}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-3 py-2.5 text-left transition ${
              active
                ? "border-primary bg-primary/10"
                : "border-border bg-surface/50 hover:border-border-strong"
            }`}
          >
            <div className="text-sm font-semibold">{o.label}</div>
            {o.sub && <div className="text-xs text-muted">{o.sub}</div>}
          </button>
        );
      })}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  step = 1,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={Number.isNaN(value) ? "" : value}
      min={min}
      step={step}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="tabular w-full rounded-xl border border-border bg-surface/50 px-3.5 py-2.5 text-base outline-none transition focus:border-primary"
    />
  );
}
