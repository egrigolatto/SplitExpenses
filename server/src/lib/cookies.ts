import type { Response } from "express";

import { env } from "../config/env.js";

export const refreshCookieName = `${env.cookieName}_refresh`;

const COOKIE_SECURE = env.nodeEnv === "production";

// SameSite=none exige Secure en el navegador; con lax/strict,
// Secure queda atado a produccion (el dev local corre en http).
const cookieSecure = env.cookieSameSite === "none" ? true : COOKIE_SECURE;

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
    secure: cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/",
  });

  if (refreshToken) {
    res.cookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: env.cookieSameSite,
      path: "/api/v1/auth",
    });
  }
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(env.cookieName);
  res.clearCookie(refreshCookieName);
}
