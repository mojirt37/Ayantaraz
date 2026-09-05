import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as S from "@/infrastructure/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err: NodeJS.ErrnoException) => {
  // Log only the error code/message: full error objects may embed connection
  // details (host, user) that must never reach log aggregators.
  console.error(`Unexpected database connection error [${err.code ?? "UNKNOWN"}]: ${err.message ?? "no message"}`);
  process.exit(1);
});

export const db = drizzle(pool, { schema: S });

export async function disconnectDb(): Promise<void> {
  await pool.end();
}

export { pool };
