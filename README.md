# Drahem L7ram 🎰

A fake-money chip tracker for in-person **poker** & **blackjack** nights. Deal
real cards; the app handles the money — live betting, side pots, buy-ins, and a
lifetime leaderboard.

Built with **Next.js 16** (App Router, Cache Components), **Auth.js** (Google),
**Neon Postgres** + **Drizzle ORM**, Tailwind v4. Deploys on **Vercel**.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run db:migrate           # create tables in your Neon database
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Neon **direct** connection (used by migrations) |
| `DATABASE_URL_POOLED` | Neon **pooled** connection (used at runtime) |
| `AUTH_SECRET` | Random secret — `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth 2.0 client credentials |

### Google OAuth

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials),
create an **OAuth 2.0 Client (Web application)** and add **Authorized redirect URIs**:

```
http://localhost:3000/api/auth/callback/google
https://YOUR-APP.vercel.app/api/auth/callback/google
```

Configure the OAuth consent screen; while it's in *Testing*, add each player's
Gmail as a **Test user**.

## Database

Schema lives in [`lib/db/schema.ts`](lib/db/schema.ts).

```bash
npm run db:generate   # generate SQL migration from schema changes
npm run db:migrate    # apply migrations (no TTY needed; Vercel-safe)
npm run db:studio     # browse data
```

## Deploy to Vercel

See the deploy steps in the project chat / below. In short: import the repo in
Vercel, add the same env vars, point `AUTH_GOOGLE` redirect URI at the Vercel
domain, and run `npm run db:migrate` once against the production database.
