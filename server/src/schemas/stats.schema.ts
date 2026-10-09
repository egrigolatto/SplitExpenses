import { z } from "zod";

import { isValidTimeZone } from "../lib/timezone.js";

export const getStatsQuerySchema = z.object({
  tz: z
    .string()
    .min(1)
    .max(64)
    .refine(isValidTimeZone, { message: "Invalid time zone" })
    .optional(),
});

const periodSchema = z.object({
  key: z.string(),
  meetings: z.number().int().min(0),
  amount: z.number().min(0),
});

const monthSchema = periodSchema.extend({
  myAmount: z.number().min(0),
});

export const statsResponseSchema = z.object({
  total: z.object({
    meetings: z.number().int().min(0),
    amount: z.number().min(0),
    myAmount: z.number().min(0),
  }),
  current: z.object({
    month: periodSchema,
    year: periodSchema,
  }),
  averagePerMeeting: z.number().min(0),
  monthly: z.array(monthSchema).length(12),
});

export type GetStatsQueryDto = z.infer<typeof getStatsQuerySchema>;
export type StatsResponse = z.infer<typeof statsResponseSchema>;
