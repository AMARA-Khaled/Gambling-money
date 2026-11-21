import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

// Neon's serverless driver talks over WebSockets, which enables real
// interactive transactions (needed for atomic chip movements). In Node
// runtimes we must provide a WebSocket implementation.
neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Missing database connection string (DATABASE_URL_POOLED / DATABASE_URL)",
  );
}

// Reuse the pool across hot reloads in development to avoid exhausting
// connections.
const globalForDb = globalThis as unknown as { __pool?: Pool };
const pool = globalForDb.__pool ?? new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
