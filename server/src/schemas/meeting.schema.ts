import { z } from "zod";
import { participantSchema } from "./participant.schema.js";

export const createMeetingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  meetingDate: z.iso.date().optional(),
  totalAmount: z.coerce.number().min(0),
  participantList: z.array(participantSchema).min(1),
});

export const updateMeetingSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    meetingDate: z.iso.date().optional(),
    totalAmount: z.coerce.number().min(0).optional(),
    participantList: z.array(participantSchema).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const meetingParamsSchema = z.object({
  id: z.uuid(),
});

export const listMeetingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateMeetingDto = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingDto = z.infer<typeof updateMeetingSchema>;
export type ListMeetingsQueryDto = z.infer<typeof listMeetingsQuerySchema>;
