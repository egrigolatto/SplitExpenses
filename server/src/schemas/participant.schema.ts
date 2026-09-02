import { z } from "zod";

export const participantSchema = z.object({
  id: z.uuid().optional(),

  name: z.string().trim().min(2).max(100),

  paidAmount: z.coerce.number().min(0),

  isOwner: z.boolean().default(false),
});

export type createParticipantDto = z.infer<typeof participantSchema>;
