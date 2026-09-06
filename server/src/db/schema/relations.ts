import { relations } from "drizzle-orm";
import { meetings } from "./meetings.js";
import { participants } from "./participants.js";
import { refreshTokens } from "./refresh-tokens.js";
import { users } from "./users.js";

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  owner: one(users, {
    fields: [meetings.ownerId],
    references: [users.id],
  }),
  participants: many(participants),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  meeting: one(meetings, {
    fields: [participants.meetingId],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  meetings: many(meetings),
  participants: many(participants),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
