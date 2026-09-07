import { AuthService } from "../auth/auth.service.js";
import { logger } from "../lib/logger.js";
import { UserRepository } from "../repositories/user.repository.js";

export const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const authService = new AuthService(new UserRepository());

export function startRefreshTokenCleanup() {
  const run = async () => {
    try {
      const { expiredDeleted, revokedDeleted } = await authService.cleanupExpiredTokens();

      if (expiredDeleted > 0 || revokedDeleted > 0) {
        logger.info({ expiredDeleted, revokedDeleted }, "Purged stale refresh tokens");
      }
    } catch (error) {
      logger.error({ err: error }, "Refresh token cleanup failed");
    }
  };

  void run();

  setInterval(() => void run(), CLEANUP_INTERVAL_MS).unref();
}
