import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),

  name: varchar({ length: 100 }).notNull(),

  email: varchar({ length: 255 }).notNull().unique(),

  passwordHash: text(),

  googleId: text(),

  createdAt: timestamp().defaultNow().notNull(),

  updatedAt: timestamp().defaultNow().notNull(),
});
