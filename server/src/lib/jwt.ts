import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;

export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiresIn as ExpiresIn,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.accessTokenSecret) as JwtPayload;
}

export function generateRefreshToken(payload: RefreshTokenPayload) {
  return jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn as ExpiresIn,
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshTokenSecret) as RefreshTokenPayload;
}
