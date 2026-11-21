CREATE TYPE "public"."bj_outcome" AS ENUM('win', 'lose', 'push', 'blackjack');--> statement-breakpoint
CREATE TYPE "public"."bj_round_status" AS ENUM('betting', 'playing', 'complete');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('lobby', 'active', 'ended');--> statement-breakpoint
CREATE TYPE "public"."game_type" AS ENUM('poker', 'blackjack');--> statement-breakpoint
CREATE TYPE "public"."join_mode" AS ENUM('open', 'code');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('active', 'sitting_out', 'busted', 'left');--> statement-breakpoint
CREATE TYPE "public"."poker_action_type" AS ENUM('post_blind', 'fold', 'check', 'call', 'bet', 'raise', 'all_in');--> statement-breakpoint
CREATE TYPE "public"."poker_hand_player_status" AS ENUM('in', 'folded', 'all_in');--> statement-breakpoint
CREATE TYPE "public"."poker_hand_status" AS ENUM('betting', 'showdown', 'complete');--> statement-breakpoint
CREATE TYPE "public"."poker_street" AS ENUM('preflop', 'flop', 'turn', 'river');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "blackjack_round_player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"game_player_id" uuid NOT NULL,
	"bet" integer DEFAULT 0 NOT NULL,
	"double_down" boolean DEFAULT false NOT NULL,
	"outcome" "bj_outcome",
	"delta" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bj_round_player_unique" UNIQUE("round_id","game_player_id")
);
--> statement-breakpoint
CREATE TABLE "blackjack_round" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"status" "bj_round_status" DEFAULT 'betting' NOT NULL,
	"dealer_player_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "game_player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"seat_order" integer NOT NULL,
	"stack" integer NOT NULL,
	"total_buyin" integer NOT NULL,
	"status" "player_status" DEFAULT 'active' NOT NULL,
	"is_dealer" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_player_unique" UNIQUE("game_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "game_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"final_stack" integer NOT NULL,
	"total_buyin" integer NOT NULL,
	"net" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "game_type" NOT NULL,
	"status" "game_status" DEFAULT 'lobby' NOT NULL,
	"created_by" text NOT NULL,
	"join_mode" "join_mode" NOT NULL,
	"join_code" text,
	"starting_stack" integer NOT NULL,
	"small_blind" integer,
	"big_blind" integer,
	"min_bet" integer,
	"current_hand_id" uuid,
	"current_round_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "game_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "poker_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hand_id" uuid NOT NULL,
	"game_player_id" uuid NOT NULL,
	"street" "poker_street" NOT NULL,
	"action" "poker_action_type" NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poker_hand_player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hand_id" uuid NOT NULL,
	"game_player_id" uuid NOT NULL,
	"status" "poker_hand_player_status" DEFAULT 'in' NOT NULL,
	"committed_total" integer DEFAULT 0 NOT NULL,
	"committed_street" integer DEFAULT 0 NOT NULL,
	"has_acted_this_street" boolean DEFAULT false NOT NULL,
	"seat_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poker_hand_player_unique" UNIQUE("hand_id","game_player_id")
);
--> statement-breakpoint
CREATE TABLE "poker_hand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"hand_number" integer NOT NULL,
	"status" "poker_hand_status" DEFAULT 'betting' NOT NULL,
	"street" "poker_street" DEFAULT 'preflop' NOT NULL,
	"button_player_id" uuid,
	"current_turn_player_id" uuid,
	"current_bet" integer DEFAULT 0 NOT NULL,
	"last_raise_size" integer DEFAULT 0 NOT NULL,
	"pot" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "poker_pot_eligibility" (
	"pot_id" uuid NOT NULL,
	"game_player_id" uuid NOT NULL,
	CONSTRAINT "poker_pot_eligibility_pot_id_game_player_id_pk" PRIMARY KEY("pot_id","game_player_id")
);
--> statement-breakpoint
CREATE TABLE "poker_pot_winner" (
	"pot_id" uuid NOT NULL,
	"game_player_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	CONSTRAINT "poker_pot_winner_pot_id_game_player_id_pk" PRIMARY KEY("pot_id","game_player_id")
);
--> statement-breakpoint
CREATE TABLE "poker_pot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hand_id" uuid NOT NULL,
	"pot_index" integer NOT NULL,
	"amount" integer NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blackjack_round_player" ADD CONSTRAINT "blackjack_round_player_round_id_blackjack_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."blackjack_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blackjack_round_player" ADD CONSTRAINT "blackjack_round_player_game_player_id_game_player_id_fk" FOREIGN KEY ("game_player_id") REFERENCES "public"."game_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blackjack_round" ADD CONSTRAINT "blackjack_round_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player" ADD CONSTRAINT "game_player_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player" ADD CONSTRAINT "game_player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_result" ADD CONSTRAINT "game_result_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_result" ADD CONSTRAINT "game_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_action" ADD CONSTRAINT "poker_action_hand_id_poker_hand_id_fk" FOREIGN KEY ("hand_id") REFERENCES "public"."poker_hand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_action" ADD CONSTRAINT "poker_action_game_player_id_game_player_id_fk" FOREIGN KEY ("game_player_id") REFERENCES "public"."game_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_hand_player" ADD CONSTRAINT "poker_hand_player_hand_id_poker_hand_id_fk" FOREIGN KEY ("hand_id") REFERENCES "public"."poker_hand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_hand_player" ADD CONSTRAINT "poker_hand_player_game_player_id_game_player_id_fk" FOREIGN KEY ("game_player_id") REFERENCES "public"."game_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_hand" ADD CONSTRAINT "poker_hand_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_pot_eligibility" ADD CONSTRAINT "poker_pot_eligibility_pot_id_poker_pot_id_fk" FOREIGN KEY ("pot_id") REFERENCES "public"."poker_pot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_pot_eligibility" ADD CONSTRAINT "poker_pot_eligibility_game_player_id_game_player_id_fk" FOREIGN KEY ("game_player_id") REFERENCES "public"."game_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_pot_winner" ADD CONSTRAINT "poker_pot_winner_pot_id_poker_pot_id_fk" FOREIGN KEY ("pot_id") REFERENCES "public"."poker_pot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_pot_winner" ADD CONSTRAINT "poker_pot_winner_game_player_id_game_player_id_fk" FOREIGN KEY ("game_player_id") REFERENCES "public"."game_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poker_pot" ADD CONSTRAINT "poker_pot_hand_id_poker_hand_id_fk" FOREIGN KEY ("hand_id") REFERENCES "public"."poker_hand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bj_round_player_round_idx" ON "blackjack_round_player" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "bj_round_game_idx" ON "blackjack_round" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_player_game_idx" ON "game_player" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_result_user_idx" ON "game_result" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_result_game_idx" ON "game_result" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_status_idx" ON "game" USING btree ("status");--> statement-breakpoint
CREATE INDEX "poker_action_hand_idx" ON "poker_action" USING btree ("hand_id");--> statement-breakpoint
CREATE INDEX "poker_hand_player_hand_idx" ON "poker_hand_player" USING btree ("hand_id");--> statement-breakpoint
CREATE INDEX "poker_hand_game_idx" ON "poker_hand" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "poker_pot_hand_idx" ON "poker_pot" USING btree ("hand_id");