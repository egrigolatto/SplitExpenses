import type { Response } from "express";

import { env } from "../config/env.js";

export const refreshCookieName = `${env.cookieName}_refresh`;

const COOKIE_SECURE = env.nodeEnv === "production";

export function setAuthCookies(
  res: Response,
  {
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken?: string | undefined;
  },
) {
  res.cookie(env.cookieName, accessToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
  });

  if (refreshToken) {
    res.cookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "lax",
      path: "/api/v1/auth",
    });
  }
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(env.cookieName);
  res.clearCookie(refreshCookieName);
}
