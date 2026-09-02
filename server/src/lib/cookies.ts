import type { Response } from "express";

import { env } from "../config/env.js";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string) {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAuthCookie(res: Response) {
  res.cookie(env.cookieName, "", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}
