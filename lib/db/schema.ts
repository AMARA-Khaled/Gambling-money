import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/* ============================================================
 * Auth.js (NextAuth) tables — standard @auth/drizzle-adapter
 * Postgres schema. Do not rename columns; the adapter relies
 * on these exact names.
 * ========================================================== */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

/* ============================================================
 * Domain enums
 * ========================================================== */

export const gameTypeEnum = pgEnum("game_type", ["poker", "blackjack"]);
export const gameStatusEnum = pgEnum("game_status", [
  "lobby",
  "active",
  "ended",
]);
export const joinModeEnum = pgEnum("join_mode", ["open", "code"]);
export const playerStatusEnum = pgEnum("player_status", [
  "active",
  "sitting_out",
  "busted",
  "left",
]);

export const pokerStreetEnum = pgEnum("poker_street", [
  "preflop",
  "flop",
  "turn",
  "river",
]);
export const pokerHandStatusEnum = pgEnum("poker_hand_status", [
  "betting",
  "showdown",
  "complete",
]);
export const pokerHandPlayerStatusEnum = pgEnum("poker_hand_player_status", [
  "in",
  "folded",
  "all_in",
]);
export const pokerActionEnum = pgEnum("poker_action_type", [
  "post_blind",
  "fold",
  "check",
  "call",
  "bet",
  "raise",
  "all_in",
]);

export const bjRoundStatusEnum = pgEnum("bj_round_status", [
  "betting",
  "playing",
  "complete",
]);
export const bjOutcomeEnum = pgEnum("bj_outcome", [
  "win",
  "lose",
  "push",
  "blackjack",
]);

/* ============================================================
 * Core game tables
 * ========================================================== */

export const games = pgTable(
  "game",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: gameTypeEnum("type").notNull(),
    status: gameStatusEnum("status").notNull().default("lobby"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinMode: joinModeEnum("join_mode").notNull(),
    joinCode: text("join_code"),
    startingStack: integer("starting_stack").notNull(),
    // Poker-only config
    smallBlind: integer("small_blind"),
    bigBlind: integer("big_blind"),
    // Blackjack-only config
    minBet: integer("min_bet"),
    // Pointer to the live hand/round so clients can poll one id
    currentHandId: uuid("current_hand_id"),
    currentRoundId: uuid("current_round_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    index("game_status_idx").on(t.status),
    unique("game_join_code_unique").on(t.joinCode),
  ],
);

export const gamePlayers = pgTable(
  "game_player",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seatOrder: integer("seat_order").notNull(),
    stack: integer("stack").notNull(),
    totalBuyin: integer("total_buyin").notNull(),
    status: playerStatusEnum("status").notNull().default("active"),
    isDealer: boolean("is_dealer").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("game_player_unique").on(t.gameId, t.userId),
    index("game_player_game_idx").on(t.gameId),
  ],
);

// Snapshot written when a game ends — powers history + leaderboard.
export const gameResults = pgTable(
  "game_result",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    finalStack: integer("final_stack").notNull(),
    totalBuyin: integer("total_buyin").notNull(),
    net: integer("net").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("game_result_user_idx").on(t.userId),
    index("game_result_game_idx").on(t.gameId),
  ],
);

/* ============================================================
 * Poker tables (No-Limit Texas Hold'em chip engine)
 * ========================================================== */

export const pokerHands = pgTable(
  "poker_hand",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    handNumber: integer("hand_number").notNull(),
    status: pokerHandStatusEnum("status").notNull().default("betting"),
    street: pokerStreetEnum("street").notNull().default("preflop"),
    buttonPlayerId: uuid("button_player_id"),
    currentTurnPlayerId: uuid("current_turn_player_id"),
    // Highest total committed in the current street (the amount to match)
    currentBet: integer("current_bet").notNull().default(0),
    // Size of the last bet/raise increment (for min-raise enforcement)
    lastRaiseSize: integer("last_raise_size").notNull().default(0),
    pot: integer("pot").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("poker_hand_game_idx").on(t.gameId)],
);

export const pokerHandPlayers = pgTable(
  "poker_hand_player",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handId: uuid("hand_id")
      .notNull()
      .references(() => pokerHands.id, { onDelete: "cascade" }),
    gamePlayerId: uuid("game_player_id")
      .notNull()
      .references(() => gamePlayers.id, { onDelete: "cascade" }),
    status: pokerHandPlayerStatusEnum("status").notNull().default("in"),
    // Chips committed to the pot across all streets this hand
    committedTotal: integer("committed_total").notNull().default(0),
    // Chips committed in the current street only
    committedStreet: integer("committed_street").notNull().default(0),
    // Whether this player has acted since the last bet/raise in this street
    hasActedThisStreet: boolean("has_acted_this_street")
      .notNull()
      .default(false),
    seatOrder: integer("seat_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("poker_hand_player_unique").on(t.handId, t.gamePlayerId),
    index("poker_hand_player_hand_idx").on(t.handId),
  ],
);

export const pokerActions = pgTable(
  "poker_action",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handId: uuid("hand_id")
      .notNull()
      .references(() => pokerHands.id, { onDelete: "cascade" }),
    gamePlayerId: uuid("game_player_id")
      .notNull()
      .references(() => gamePlayers.id, { onDelete: "cascade" }),
    street: pokerStreetEnum("street").notNull(),
    action: pokerActionEnum("action").notNull(),
    amount: integer("amount").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("poker_action_hand_idx").on(t.handId)],
);

// Pots (main + side) computed at showdown and resolved by the host.
export const pokerPots = pgTable(
  "poker_pot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handId: uuid("hand_id")
      .notNull()
      .references(() => pokerHands.id, { onDelete: "cascade" }),
    potIndex: integer("pot_index").notNull(),
    amount: integer("amount").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("poker_pot_hand_idx").on(t.handId)],
);

// Which players are eligible to win a given pot (contributed, not folded).
export const pokerPotEligibility = pgTable(
  "poker_pot_eligibility",
  {
    potId: uuid("pot_id")
      .notNull()
      .references(() => pokerPots.id, { onDelete: "cascade" }),
    gamePlayerId: uuid("game_player_id")
      .notNull()
      .references(() => gamePlayers.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.potId, t.gamePlayerId] })],
);

// Winner(s) of each pot (multiple rows => split pot).
export const pokerPotWinners = pgTable(
  "poker_pot_winner",
  {
    potId: uuid("pot_id")
      .notNull()
      .references(() => pokerPots.id, { onDelete: "cascade" }),
    gamePlayerId: uuid("game_player_id")
      .notNull()
      .references(() => gamePlayers.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
  },
  (t) => [primaryKey({ columns: [t.potId, t.gamePlayerId] })],
);

/* ============================================================
 * Blackjack tables
 * ========================================================== */

export const blackjackRounds = pgTable(
  "blackjack_round",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    status: bjRoundStatusEnum("status").notNull().default("betting"),
    dealerPlayerId: uuid("dealer_player_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("bj_round_game_idx").on(t.gameId)],
);

export const blackjackRoundPlayers = pgTable(
  "blackjack_round_player",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => blackjackRounds.id, { onDelete: "cascade" }),
    gamePlayerId: uuid("game_player_id")
      .notNull()
      .references(() => gamePlayers.id, { onDelete: "cascade" }),
    bet: integer("bet").notNull().default(0),
    doubleDown: boolean("double_down").notNull().default(false),
    outcome: bjOutcomeEnum("outcome"),
    delta: integer("delta").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("bj_round_player_unique").on(t.roundId, t.gamePlayerId),
    index("bj_round_player_round_idx").on(t.roundId),
  ],
);
