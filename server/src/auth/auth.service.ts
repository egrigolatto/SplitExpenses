import argon2 from "argon2";

import { AppError } from "../errors/app-error.js";
import { UserRepository } from "../repositories/user.repository.js";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { generateAccessToken, verifyRefreshToken } from "../lib/jwt.js";
import { hashToken, issueSession, rotateSession } from "../lib/session.js";
import { toPublicUser } from "../lib/user-serializer.js";
import { CreateUserDto } from "../schemas/user.schema.js";
import { LoginDto } from "../schemas/auth.schema.js";

const REUSE_GRACE_PERIOD_MS = 10_000;

export class AuthService {
  private readonly refreshRepository: RefreshTokenRepository;

  constructor(private readonly repository: UserRepository) {
    this.refreshRepository = new RefreshTokenRepository();
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async registerUser(dto: CreateUserDto) {
    const { name, password } = dto;
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.repository.findByEmail(email);

    if (existingUser) {
      throw new AppError(409, "Email already registered");
    }

    const passwordHash = await argon2.hash(password);

    const user = await this.repository.create({
      name,
      email,
      passwordHash,
    });

    if (!user) {
      throw new AppError(500, "User could not be created");
    }

    const tokens = await issueSession(user.id);

    return { user: toPublicUser(user), ...tokens };
  }

  async loginUser(dto: LoginDto) {
    const { password } = dto;
    const email = this.normalizeEmail(dto.email);
    const user = await this.repository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new AppError(401, "Invalid credentials");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      throw new AppError(401, "Invalid credentials");
    }

    const tokens = await issueSession(user.id);

    return { user: toPublicUser(user), ...tokens };
  }

  async refreshSession(rawRefreshToken: string) {
    try {
      verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.refreshRepository.findByHash(tokenHash);

    if (!stored) {
      throw new AppError(401, "Invalid refresh token");
    }

    if (stored.revokedAt) {
      const reusedRecently =
        stored.revokedReason === "rotated" &&
        Date.now() - stored.revokedAt.getTime() <= REUSE_GRACE_PERIOD_MS;

      if (reusedRecently) {
        const user = await this.repository.findById(stored.userId);

        if (!user) {
          throw new AppError(401, "Invalid refresh token");
        }

        return {
          user: toPublicUser(user),
          accessToken: generateAccessToken({ sub: user.id }),
          refreshToken: undefined,
        };
      }

      await this.refreshRepository.revokeFamily(stored.familyId);

      throw new AppError(401, "Invalid refresh token");
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new AppError(401, "Invalid refresh token");
    }

    const user = await this.repository.findById(stored.userId);

    if (!user) {
      throw new AppError(401, "Invalid refresh token");
    }

    const rotated = await rotateSession(stored.id, stored.userId, stored.familyId);

    if (!rotated) {
      throw new AppError(500, "Session could not be refreshed");
    }

    return { user: toPublicUser(user), ...rotated };
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.refreshRepository.findByHash(tokenHash);

    if (stored && !stored.revokedAt) {
      await this.refreshRepository.revoke(stored.id);
    }
  }

  async cleanupExpiredTokens() {
    await this.refreshRepository.deleteExpired(new Date());
  }
}
