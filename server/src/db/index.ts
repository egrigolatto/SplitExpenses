import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import * as schema from "./schema/index.js";

const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle PostgreSQL client; connection removed from pool");
});

export const db = drizzle(pool, {
  schema,
});

export async function closePool() {
  await pool.end();
}
