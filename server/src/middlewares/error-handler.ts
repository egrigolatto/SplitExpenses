import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    logger.warn(
      {
        issues: error.issues,
        method: req.method,
        path: req.originalUrl,
      },
      "Validation failed",
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
  }

  if (error instanceof AppError) {
    logger.warn(
      {
        statusCode: error.statusCode,
        method: req.method,
        path: req.originalUrl,
      },
      error.message,
    );

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  logger.error(
    {
      err: error,
      method: req.method,
      path: req.originalUrl,
    },
    "Unhandled error",
  );

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
