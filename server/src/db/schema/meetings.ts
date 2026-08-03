import { pgTable, uuid, varchar, date, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const meetings = pgTable("meetings", {
  id: uuid().defaultRandom().primaryKey(),

  ownerId: uuid()
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  name: varchar({ length: 100 }).notNull(),

  meetingDate: date().notNull(),

  totalAmount: numeric({
    precision: 10,
    scale: 2,
  }).notNull(),

  createdAt: timestamp().defaultNow().notNull(),

  updatedAt: timestamp().defaultNow().notNull(),
});
