import { z } from "zod";
import { participantSchema } from "./participant.schema.js";

export const createMeetingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  totalAmount: z.coerce.number().min(0),
  participantList: z.array(participantSchema).min(1),
});

export type CreateMeetingDto = z.infer<typeof createMeetingSchema>;
