import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  PORT: z.coerce.number(),

  DATABASE_URL: z.url(),

  JWT_SECRET: z.string().min(32),

  JWT_EXPIRES_IN: z.coerce.number(),

  COOKIE_NAME: z.string(),
});
