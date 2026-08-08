import type { RequestHandler } from "express";

import { AppError } from "../errors/app-error.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { env } from "../config/env.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  try {
    const token = req.cookies[env.cookieName];

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
    };

    next();
  } catch (error) {
    next(error);
  }
};
