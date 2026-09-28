import { z } from "zod";

export const participantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre debe tener como maximo 100 caracteres"),

  paidAmount: z
    .string()
    .trim()
    .min(1, "Ingresá un monto")
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Ingresá un monto válido")
    .transform(Number),
});

export const meetingFormSchema = z
  .object({
    name: z.string().trim().max(100, "El nombre debe tener como maximo 100 caracteres"),

    participants: z.array(participantFormSchema).min(2, "Agrega al menos 2 participantes"),
  })
  .superRefine((data, ctx) => {
    const amounts = data.participants.map((participant) => participant.paidAmount);

    if (amounts.some((amount) => !Number.isFinite(amount))) {
      return;
    }

    const total = amounts.reduce((sum, amount) => sum + amount, 0);

    if (total <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Al menos un participante debe haber pagado un monto mayor a 0",
        path: ["participants"],
      });
    }
  });

export type MeetingFormInput = z.input<typeof meetingFormSchema>;
export type MeetingFormValues = z.output<typeof meetingFormSchema>;
export type ParticipantFormInput = z.input<typeof participantFormSchema>;
export type ParticipantFormValues = z.output<typeof participantFormSchema>;
