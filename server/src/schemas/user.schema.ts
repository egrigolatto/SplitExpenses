import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.email(),

  password: z.string().min(8).max(100),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.email().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
