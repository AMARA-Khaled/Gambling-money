// Pure types shared between server and client. No server-only imports here.

export type GameType = "poker" | "blackjack";
export type GameStatus = "lobby" | "active" | "ended";
export type JoinMode = "open" | "code";
export type PlayerStatus = "active" | "sitting_out" | "busted" | "left";

export type StatePlayer = {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  seatOrder: number;
  stack: number;
  totalBuyin: number;
  status: PlayerStatus;
  isDealer: boolean;
  net: number;
};

export type GameState = {
  game: {
    id: string;
    type: GameType;
    status: GameStatus;
    joinMode: JoinMode;
    joinCode: string | null;
    startingStack: number;
    smallBlind: number | null;
    bigBlind: number | null;
    minBet: number | null;
    createdBy: string;
    currentHandId: string | null;
    currentRoundId: string | null;
  };
  me: {
    userId: string;
    gamePlayerId: string | null;
    isHost: boolean;
    isPlayer: boolean;
    isDealer: boolean;
  };
  players: StatePlayer[];
};
