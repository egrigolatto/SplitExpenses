import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
}

export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
