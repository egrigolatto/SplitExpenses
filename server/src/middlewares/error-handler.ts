import type { ErrorRequestHandler } from "express";

import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  logger.error(
    {
      err: error,
      method: req.method,
      path: req.originalUrl,
    },
    "Unhandled error",
  );

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
