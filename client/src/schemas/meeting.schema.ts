import { z } from "zod";

export const participantSchema = z.object({
  id: z.uuid(),
  meetingId: z.uuid(),
  userId: z.uuid().nullable(),
  name: z.string(),
  paidAmount: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const meetingSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string(),
  meetingDate: z.string(),
  totalAmount: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const meetingWithParticipantsSchema = meetingSchema.extend({
  participants: z.array(participantSchema),
});

export const createdMeetingSchema = z.object({
  meeting: meetingSchema,
  participants: z.array(participantSchema),
});

export const meetingListSchema = z.object({
  items: z.array(meetingWithParticipantsSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export const participantRequestSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(100),
  paidAmount: z.number().min(0),
  isOwner: z.boolean(),
});

export const createMeetingRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  meetingDate: z.iso.date().optional(),
  totalAmount: z.number().min(0),
  participantList: z.array(participantRequestSchema).min(1),
});

export const updateMeetingRequestSchema = createMeetingRequestSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const listMeetingsQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export type Participant = z.infer<typeof participantSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type MeetingWithParticipants = z.infer<typeof meetingWithParticipantsSchema>;
export type CreatedMeeting = z.infer<typeof createdMeetingSchema>;
export type MeetingList = z.infer<typeof meetingListSchema>;
export type ParticipantRequest = z.infer<typeof participantRequestSchema>;
export type CreateMeetingRequest = z.infer<typeof createMeetingRequestSchema>;
export type UpdateMeetingRequest = z.infer<typeof updateMeetingRequestSchema>;
export type ListMeetingsQuery = z.infer<typeof listMeetingsQuerySchema>;
