import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

function tooManyRequestsHandler(_req: Request, res: Response) {
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later",
  });
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});
