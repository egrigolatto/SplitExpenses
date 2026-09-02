import type { users } from "../db/schema/users.js";

type UserRow = typeof users.$inferSelect;

export type PublicUser = Omit<UserRow, "passwordHash">;

export function toPublicUser<T extends { passwordHash?: string | null }>(
  user: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
