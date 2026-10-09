import { z } from "zod";

const statsPeriodSchema = z.object({
  key: z.string(),
  meetings: z.number().int().min(0),
  amount: z.number().min(0),
});

export const statsResponseSchema = z.object({
  total: z.object({
    meetings: z.number().int().min(0),
    amount: z.number().min(0),
  }),
  current: z.object({
    month: statsPeriodSchema,
    year: statsPeriodSchema,
  }),
  averagePerMeeting: z.number().min(0),
  monthly: z.array(statsPeriodSchema).length(12),
});

export type StatsResponse = z.infer<typeof statsResponseSchema>;
