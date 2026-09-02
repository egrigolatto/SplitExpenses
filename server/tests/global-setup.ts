import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env.test") });

const TEST_DATABASE_URL = process.env.DATABASE_URL as string;
const DEFAULT_DATABASE_URL = TEST_DATABASE_URL.replace(/\/([^/]+)$/, "/postgres");
const TEST_DB_NAME = new URL(TEST_DATABASE_URL).pathname.replace(/^\//, "");

export default async function globalSetup() {
  const adminPool = new Pool({ connectionString: DEFAULT_DATABASE_URL });

  const { rowCount } = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    TEST_DB_NAME,
  ]);

  if (rowCount === 0) {
    await adminPool.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  }

  await adminPool.end();

  const migrationsPath = join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle");

  if (!readdirSync(migrationsPath).some((file) => file.endsWith(".sql"))) {
    throw new Error("No migration files found");
  }

  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: migrationsPath });

  await pool.end();
}
