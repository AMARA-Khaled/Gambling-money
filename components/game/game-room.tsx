"use client";

import useSWR from "swr";
import type { GameState } from "@/lib/game-types";
import { Lobby } from "./lobby";

const fetcher = async (url: string): Promise<GameState> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load game");
  return res.json();
};

export function GameRoom({ initialState }: { initialState: GameState }) {
  const { data } = useSWR<GameState>(
    `/api/games/${initialState.game.id}/state`,
    fetcher,
    { fallbackData: initialState, refreshInterval: 2000 },
  );

  const state = data ?? initialState;

  switch (state.game.status) {
    case "lobby":
      return <Lobby state={state} />;
    case "active":
      return <ComingSoon state={state} label="Live play" />;
    case "ended":
      return <ComingSoon state={state} label="Final results" />;
  }
}

function ComingSoon({ state, label }: { state: GameState; label: string }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
      <p className="text-sm text-muted">
        {label} for this {state.game.type} game is being built.
      </p>
    </div>
  );
}
