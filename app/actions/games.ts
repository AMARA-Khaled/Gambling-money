"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/dal";
import {
  createGameRecord,
  joinGame,
  findGameIdByCode,
  getGameState,
  startGame as startGameRecord,
  kickPlayer as kickPlayerRecord,
} from "@/lib/games";
import { normalizeJoinCode } from "@/lib/codes";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const createSchema = z
  .object({
    type: z.enum(["poker", "blackjack"]),
    joinMode: z.enum(["open", "code"]),
    startingStack: z.coerce.number().int().positive().max(100_000_000),
    smallBlind: z.coerce.number().int().positive().optional(),
    bigBlind: z.coerce.number().int().positive().optional(),
    minBet: z.coerce.number().int().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "poker") {
      if (!val.smallBlind || !val.bigBlind) {
        ctx.addIssue({
          code: "custom",
          message: "Poker needs small and big blind amounts.",
          path: ["bigBlind"],
        });
        return;
      }
      if (val.smallBlind > val.bigBlind) {
        ctx.addIssue({
          code: "custom",
          message: "Small blind can't exceed big blind.",
          path: ["smallBlind"],
        });
      }
      if (val.bigBlind > val.startingStack) {
        ctx.addIssue({
          code: "custom",
          message: "Big blind can't exceed the starting stack.",
          path: ["bigBlind"],
        });
      }
    } else {
      if (!val.minBet) {
        ctx.addIssue({
          code: "custom",
          message: "Blackjack needs a minimum bet.",
          path: ["minBet"],
        });
      } else if (val.minBet > val.startingStack) {
        ctx.addIssue({
          code: "custom",
          message: "Minimum bet can't exceed the starting stack.",
          path: ["minBet"],
        });
      }
    }
  });

export type CreateGameInput = z.input<typeof createSchema>;

export async function createGame(
  input: CreateGameInput,
): Promise<{ error: string } | void> {
  const user = await requireUser();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  const gameId = await createGameRecord({
    userId: user.id,
    ...parsed.data,
  });

  redirect(`/games/${gameId}`);
}

export async function joinOpenGame(
  gameId: string,
): Promise<{ error: string } | void> {
  const user = await requireUser();

  const [game] = await db
    .select({ joinMode: games.joinMode })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1);
  if (!game) return { error: "Game not found." };
  if (game.joinMode !== "open") {
    return { error: "This game requires a join code." };
  }

  const result = await joinGame(gameId, user.id);
  if (!result.ok) return { error: result.reason };

  redirect(`/games/${gameId}`);
}

export async function joinWithCode(
  rawCode: string,
): Promise<{ error: string } | void> {
  const user = await requireUser();
  const code = normalizeJoinCode(rawCode);
  if (code.length < 4) return { error: "Enter a valid code." };

  const gameId = await findGameIdByCode(code);
  if (!gameId) return { error: "No game found for that code." };

  const result = await joinGame(gameId, user.id);
  if (!result.ok) return { error: result.reason };

  redirect(`/games/${gameId}`);
}

export async function startGameAction(
  gameId: string,
): Promise<{ error: string } | void> {
  const user = await requireUser();
  const result = await startGameRecord(gameId, user.id);
  if (!result.ok) return { error: result.reason };
}

export async function kickPlayerAction(
  gameId: string,
  gamePlayerId: string,
): Promise<{ error: string } | void> {
  const user = await requireUser();
  const result = await kickPlayerRecord(gameId, user.id, gamePlayerId);
  if (!result.ok) return { error: result.reason };
}

/** Used by the lobby "already a member?" check before auto-joining via link. */
export async function getMyGameState(gameId: string) {
  const user = await requireUser();
  return getGameState(gameId, user.id);
}
