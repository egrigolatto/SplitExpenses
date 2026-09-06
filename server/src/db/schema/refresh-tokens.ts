import { pgEnum, pgTable, timestamp, uuid, text, index } from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const revocationReason = pgEnum("revocation_reason", ["rotated", "logout", "reuse"]);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid().defaultRandom().primaryKey(),

    userId: uuid()
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    familyId: uuid().notNull(),

    tokenHash: text().notNull().unique(),

    expiresAt: timestamp({ withTimezone: true }).notNull(),

    createdAt: timestamp().defaultNow().notNull(),

    revokedAt: timestamp({ withTimezone: true }),

    revokedReason: revocationReason(),
  },
  (table) => [
    index("idx_refresh_tokens_family").on(table.familyId),
    index("idx_refresh_tokens_user").on(table.userId),
  ],
);
