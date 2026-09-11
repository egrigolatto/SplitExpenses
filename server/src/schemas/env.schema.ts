import { z } from "zod";

export const trustProxySchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().int().min(0).max(5).optional(),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  PORT: z.coerce.number(),

  DATABASE_URL: z.url(),

  JWT_SECRET: z.string().min(32),

  JWT_EXPIRES_IN: z.coerce.number(),

  ACCESS_TOKEN_SECRET: z.string().min(32),

  REFRESH_TOKEN_SECRET: z.string().min(32),

  ACCESS_TOKEN_EXPIRES_IN: z.string(),

  REFRESH_TOKEN_EXPIRES_IN: z.string(),

  COOKIE_NAME: z.string(),

  GOOGLE_CLIENT_ID: z.string(),

  GOOGLE_CLIENT_SECRET: z.string(),

  GOOGLE_REDIRECT_URI: z.url(),

  FRONTEND_URL: z.url(),

  TRUST_PROXY: trustProxySchema,
});
