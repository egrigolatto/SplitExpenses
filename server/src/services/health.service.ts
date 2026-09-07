import { sql } from "drizzle-orm";

import { db } from "../db/index.js";

const DB_CHECK_TIMEOUT_MS = 2000;

export class HealthService {
  getStatus() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  async isDatabaseReachable() {
    try {
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise<never>((_resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Database health check timed out")),
            DB_CHECK_TIMEOUT_MS,
          );

          timer.unref();
        }),
      ]);

      return true;
    } catch {
      return false;
    }
  }
}
