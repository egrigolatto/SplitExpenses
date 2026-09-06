import { numeric, pgTable, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";

import { meetings } from "./meetings.js";
import { users } from "./users.js";

export const participants = pgTable(
  "participants",
  {
    id: uuid().defaultRandom().primaryKey(),

    meetingId: uuid()
      .notNull()
      .references(() => meetings.id, {
        onDelete: "cascade",
      }),

    userId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),

    name: varchar({ length: 100 }).notNull(),

    paidAmount: numeric({
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),

    createdAt: timestamp().defaultNow().notNull(),

    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index("idx_participants_meeting").on(table.meetingId)],
);
