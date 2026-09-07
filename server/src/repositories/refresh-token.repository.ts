import { and, eq, isNotNull, isNull, lte } from "drizzle-orm";

import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema/refresh-tokens.js";

interface CreateRefreshToken {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
}

export class RefreshTokenRepository {
  async create(data: CreateRefreshToken) {
    const [token] = await db.insert(refreshTokens).values(data).returning();

    return token;
  }

  async findByHash(tokenHash: string) {
    return db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });
  }

  async rotate(consumedId: string, data: CreateRefreshToken) {
    const [oldToken] = await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), revokedReason: "rotated" })
      .where(eq(refreshTokens.id, consumedId))
      .returning();

    if (!oldToken) {
      return undefined;
    }

    const [newToken] = await db.insert(refreshTokens).values(data).returning();

    return newToken;
  }

  async revokeFamily(familyId: string) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), revokedReason: "reuse" })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)));
  }

  async revoke(id: string) {
    const [token] = await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), revokedReason: "logout" })
      .where(eq(refreshTokens.id, id))
      .returning();

    return token;
  }

  async revokeAllForUser(userId: string) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), revokedReason: "logout" })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  async deleteExpired(now: Date) {
    const deleted = await db
      .delete(refreshTokens)
      .where(lte(refreshTokens.expiresAt, now))
      .returning({ id: refreshTokens.id });

    return deleted.length;
  }

  async deleteRevokedBefore(cutoff: Date) {
    const deleted = await db
      .delete(refreshTokens)
      .where(and(isNotNull(refreshTokens.revokedAt), lte(refreshTokens.revokedAt, cutoff)))
      .returning({ id: refreshTokens.id });

    return deleted.length;
  }
}
