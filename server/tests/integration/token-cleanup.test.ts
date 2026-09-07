import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { cleanDatabase, registerAndLogin } from "../helpers.js";
import { db } from "../../src/db/index.js";
import { refreshTokens } from "../../src/db/schema/refresh-tokens.js";
import { AuthService } from "../../src/auth/auth.service.js";
import { UserRepository } from "../../src/repositories/user.repository.js";

const authService = new AuthService(new UserRepository());

const DAY_MS = 24 * 60 * 60 * 1000;

async function tokensFor(userId: string) {
  return db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId));
}

describe("Refresh token cleanup", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("should delete expired tokens and keep active ones", async () => {
    const { id } = await registerAndLogin();

    const tokens = await tokensFor(id!);
    expect(tokens).toHaveLength(2);

    const [expired, active] = tokens;

    await db
      .update(refreshTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(refreshTokens.id, expired!.id));

    const result = await authService.cleanupExpiredTokens();

    expect(result.expiredDeleted).toBe(1);
    expect(result.revokedDeleted).toBe(0);

    const remaining = await tokensFor(id!);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(active!.id);
  });

  it("should delete revoked tokens older than the retention window", async () => {
    const { id } = await registerAndLogin();

    const tokens = await tokensFor(id!);
    const [staleRevoked, recentRevoked] = tokens;

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(Date.now() - 31 * DAY_MS), revokedReason: "logout" })
      .where(eq(refreshTokens.id, staleRevoked!.id));

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(Date.now() - DAY_MS), revokedReason: "logout" })
      .where(eq(refreshTokens.id, recentRevoked!.id));

    const result = await authService.cleanupExpiredTokens();

    expect(result.revokedDeleted).toBe(1);

    const remaining = await tokensFor(id!);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(recentRevoked!.id);
  });

  it("should keep tokens that are active and unexpired", async () => {
    const { id } = await registerAndLogin();

    const result = await authService.cleanupExpiredTokens();

    expect(result.expiredDeleted).toBe(0);
    expect(result.revokedDeleted).toBe(0);

    const remaining = await tokensFor(id!);
    expect(remaining).toHaveLength(2);
  });
});
