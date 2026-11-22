import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 90, // stay signed in for 90 days
    updateAge: 60 * 60 * 24, // refresh the session at most once a day
  },
  callbacks: {
    session({ session, user }) {
      // Expose the stable user id to the app (needed for players/leaderboard).
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
