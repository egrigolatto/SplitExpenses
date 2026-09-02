import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";
import { logger } from "../lib/logger.js";

function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
}

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
      errors: formatZodIssues(error),
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

  const isBodyParseError =
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: unknown }).status === 400 &&
    "body" in error;

  if (isBodyParseError) {
    logger.warn(
      {
        method: req.method,
        path: req.originalUrl,
      },
      "Invalid JSON body",
    );

    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
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
