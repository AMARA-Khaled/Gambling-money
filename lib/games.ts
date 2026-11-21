import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { games, gamePlayers, users } from "@/lib/db/schema";
import { generateJoinCode } from "@/lib/codes";
import type {
  GameType,
  GameStatus,
  JoinMode,
  GameState,
  StatePlayer,
} from "@/lib/game-types";

export type { GameState, StatePlayer } from "@/lib/game-types";

type CreateGameInput = {
  userId: string;
  type: GameType;
  joinMode: JoinMode;
  startingStack: number;
  smallBlind?: number;
  bigBlind?: number;
  minBet?: number;
};

export async function createGameRecord(input: CreateGameInput): Promise<string> {
  return db.transaction(async (tx) => {
    let joinCode: string | null = null;
    if (input.joinMode === "code") {
      // Generate a unique code (retry on the rare collision).
      for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = generateJoinCode();
        const existing = await tx
          .select({ id: games.id })
          .from(games)
          .where(eq(games.joinCode, candidate))
          .limit(1);
        if (existing.length === 0) {
          joinCode = candidate;
          break;
        }
      }
      if (!joinCode) throw new Error("Could not generate a unique join code");
    }

    const [game] = await tx
      .insert(games)
      .values({
        type: input.type,
        status: "lobby",
        createdBy: input.userId,
        joinMode: input.joinMode,
        joinCode,
        startingStack: input.startingStack,
        smallBlind: input.type === "poker" ? input.smallBlind : null,
        bigBlind: input.type === "poker" ? input.bigBlind : null,
        minBet: input.type === "blackjack" ? input.minBet : null,
      })
      .returning({ id: games.id });

    // Seat the creator. For blackjack they start as the dealer.
    await tx.insert(gamePlayers).values({
      gameId: game.id,
      userId: input.userId,
      seatOrder: 0,
      stack: input.startingStack,
      totalBuyin: input.startingStack,
      status: "active",
      isDealer: input.type === "blackjack",
    });

    return game.id;
  });
}

export async function getGameState(
  gameId: string,
  userId: string,
): Promise<GameState | null> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return null;

  const rows = await db
    .select({
      id: gamePlayers.id,
      userId: gamePlayers.userId,
      name: users.name,
      image: users.image,
      seatOrder: gamePlayers.seatOrder,
      stack: gamePlayers.stack,
      totalBuyin: gamePlayers.totalBuyin,
      status: gamePlayers.status,
      isDealer: gamePlayers.isDealer,
    })
    .from(gamePlayers)
    .innerJoin(users, eq(users.id, gamePlayers.userId))
    .where(eq(gamePlayers.gameId, gameId))
    .orderBy(asc(gamePlayers.seatOrder));

  const players: StatePlayer[] = rows.map((r) => ({
    ...r,
    net: r.stack - r.totalBuyin,
  }));

  const mine = players.find((p) => p.userId === userId) ?? null;

  return {
    game: {
      id: game.id,
      type: game.type,
      status: game.status,
      joinMode: game.joinMode,
      joinCode: game.joinCode,
      startingStack: game.startingStack,
      smallBlind: game.smallBlind,
      bigBlind: game.bigBlind,
      minBet: game.minBet,
      createdBy: game.createdBy,
      currentHandId: game.currentHandId,
      currentRoundId: game.currentRoundId,
    },
    me: {
      userId,
      gamePlayerId: mine?.id ?? null,
      isHost: game.createdBy === userId,
      isPlayer: mine !== null,
      isDealer: mine?.isDealer ?? false,
    },
    players,
  };
}

/** Seat a user into a lobby game. Idempotent if already seated. */
export async function joinGame(
  gameId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  return db.transaction(async (tx) => {
    const [game] = await tx
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    if (!game) return { ok: false as const, reason: "Game not found" };
    if (game.status !== "lobby") {
      return { ok: false as const, reason: "This game has already started" };
    }

    const existing = await tx
      .select({ id: gamePlayers.id })
      .from(gamePlayers)
      .where(
        and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.userId, userId)),
      )
      .limit(1);
    if (existing.length > 0) return { ok: true as const };

    const [{ next }] = await tx
      .select({
        next: sql<number>`coalesce(max(${gamePlayers.seatOrder}), -1) + 1`,
      })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));

    await tx.insert(gamePlayers).values({
      gameId,
      userId,
      seatOrder: next,
      stack: game.startingStack,
      totalBuyin: game.startingStack,
      status: "active",
      isDealer: false,
    });

    return { ok: true as const };
  });
}

export type UserGameSummary = {
  id: string;
  type: GameType;
  status: GameStatus;
  joinMode: JoinMode;
  createdAt: Date;
  endedAt: Date | null;
  isHost: boolean;
  myStack: number;
  myBuyin: number;
  net: number;
  playerCount: number;
};

export async function getUserGames(
  userId: string,
): Promise<UserGameSummary[]> {
  const rows = await db
    .select({
      id: games.id,
      type: games.type,
      status: games.status,
      joinMode: games.joinMode,
      createdAt: games.createdAt,
      endedAt: games.endedAt,
      createdBy: games.createdBy,
      myStack: gamePlayers.stack,
      myBuyin: gamePlayers.totalBuyin,
      playerCount: sql<number>`(
        select count(*)::int from ${gamePlayers} gp2 where gp2.game_id = ${games.id}
      )`,
    })
    .from(gamePlayers)
    .innerJoin(games, eq(games.id, gamePlayers.gameId))
    .where(eq(gamePlayers.userId, userId))
    .orderBy(desc(games.createdAt))
    .limit(30);

  return rows.map((r) => ({
    id: r.id,
    type: r.type as GameType,
    status: r.status as GameStatus,
    joinMode: r.joinMode as JoinMode,
    createdAt: r.createdAt,
    endedAt: r.endedAt,
    isHost: r.createdBy === userId,
    myStack: r.myStack,
    myBuyin: r.myBuyin,
    net: r.myStack - r.myBuyin,
    playerCount: r.playerCount,
  }));
}

export async function findGameIdByCode(code: string): Promise<string | null> {
  const [game] = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.joinCode, code))
    .limit(1);
  return game?.id ?? null;
}
