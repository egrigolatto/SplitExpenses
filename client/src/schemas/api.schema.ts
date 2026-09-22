import { z } from "zod";

export const apiFieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(apiFieldErrorSchema).optional(),
});

export function successEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export type ApiFieldError = z.infer<typeof apiFieldErrorSchema>;
