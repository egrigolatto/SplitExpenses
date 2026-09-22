import { z } from "zod";

export const healthStatusSchema = z.object({
  status: z.string(),
  timestamp: z.iso.datetime(),
});

export const readinessStatusSchema = healthStatusSchema.extend({
  database: z.boolean(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type ReadinessStatus = z.infer<typeof readinessStatusSchema>;
