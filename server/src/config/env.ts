import dotenv from "dotenv";
import { envSchema } from "../schemas/env.schema.js";

dotenv.config();

const parsedEnv = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  databaseUrl: parsedEnv.DATABASE_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtExpiresIn: parsedEnv.JWT_EXPIRES_IN,
  cookieName: parsedEnv.COOKIE_NAME,
};
