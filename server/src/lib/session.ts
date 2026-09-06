import { createHash, randomUUID } from "node:crypto";

import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { generateAccessToken, generateRefreshToken } from "./jwt.js";
import { env } from "../config/env.js";

const HASH_ALGORITHM = "sha256";

export function hashToken(token: string) {
  return createHash(HASH_ALGORITHM).update(token).digest("hex");
}

export async function issueSession(userId: string) {
  const familyId = randomUUID();
  const tokens = await createTokens(userId, familyId);

  const repository = new RefreshTokenRepository();

  await repository.create({
    userId,
    familyId,
    tokenHash: tokens.refreshHash,
    expiresAt: refreshExpiresAt(),
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function rotateSession(consumedId: string, userId: string, familyId: string) {
  const tokens = await createTokens(userId, familyId);

  const repository = new RefreshTokenRepository();

  const created = await repository.rotate(consumedId, {
    userId,
    familyId,
    tokenHash: tokens.refreshHash,
    expiresAt: refreshExpiresAt(),
  });

  if (!created) {
    return undefined;
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

async function createTokens(userId: string, familyId: string) {
  const accessToken = generateAccessToken({ sub: userId });
  const jti = randomUUID();
  const refreshToken = generateRefreshToken({ sub: userId, jti });

  return {
    accessToken,
    refreshToken,
    refreshHash: hashToken(refreshToken),
    jti,
    familyId,
  };
}

function refreshExpiresAt(): Date {
  const seconds = parseDuration(env.refreshTokenExpiresIn);
  return new Date(Date.now() + seconds * 1000);
}

function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    return 30 * 24 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return amount;
    case "m":
      return amount * 60;
    case "h":
      return amount * 60 * 60;
    case "d":
    default:
      return amount * 24 * 60 * 60;
  }
}
