import type { CookieOptions, Response } from "express";

import { env } from "../config/env.js";

export const refreshCookieName = `${env.cookieName}_refresh`;

const COOKIE_SECURE = env.nodeEnv === "production";

// SameSite=none exige Secure en el navegador; con lax/strict,
// Secure queda atado a produccion (el dev local corre en http).
const cookieSecure = env.cookieSameSite === "none" ? true : COOKIE_SECURE;

const REFRESH_COOKIE_PATH = "/api/v1/auth";

// Unicas opciones de cookies: set y clear deben emitir atributos identicos,
// o el navegador no matchea la eliminacion (name+domain+path+secure+samesite).
function cookieOptions(path: string): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: env.cookieSameSite,
    path,
  };
}

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
  res.cookie(env.cookieName, accessToken, cookieOptions("/"));

  if (refreshToken) {
    res.cookie(refreshCookieName, refreshToken, cookieOptions(REFRESH_COOKIE_PATH));
  }
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(refreshCookieName, cookieOptions(REFRESH_COOKIE_PATH));
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(env.cookieName, cookieOptions("/"));
  clearRefreshCookie(res);
}
