import { envSchema } from "../schemas/env.schema";

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");

  throw new Error(`Variables de entorno invalidas: ${details}`);
}

export const env = parsed.data;
