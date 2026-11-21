// Programmatic migrator — applies ./drizzle migrations without needing a TTY.
// Works locally and in CI/Vercel. Uses the direct (non-pooled) connection.
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "dotenv";

config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_POOLED;
if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migrations applied");
} catch (err) {
  console.error("✗ Migration failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
