import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.email(),

  password: z.string().min(8).max(100),
});

export const userParamsSchema = z.object({
  id: z.uuid(),
});
