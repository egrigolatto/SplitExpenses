import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { closePool } from "./db/index.js";
import { startRefreshTokenCleanup } from "./jobs/refresh-token-cleanup.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(env.port, () => {
  logger.info(
    {
      port: env.port,
    },
    `Server started in http://localhost:${env.port}`,
  );

  startRefreshTokenCleanup();
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info({ signal }, "Shutting down gracefully");

  const forceExit = setTimeout(() => {
    logger.error(`Forced shutdown after ${SHUTDOWN_TIMEOUT_MS}ms`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceExit.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeIdleConnections();
    });

    await closePool();

    logger.info("Server closed");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
