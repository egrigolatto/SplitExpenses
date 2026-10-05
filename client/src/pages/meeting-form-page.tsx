import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { ParticipantRow } from "../components/participant-row";
import { Button } from "../components/ui/button";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { useSession } from "../hooks/use-session";
import {
  meetingFormSchema,
  type MeetingFormInput,
  type MeetingFormValues,
} from "../schemas/meeting-form.schema";
import { useMeetingDraft } from "../store/meeting-draft";
import { resolveMeetingName } from "../utils/meeting-name";

const INITIAL_PARTICIPANTS: MeetingFormInput["participants"] = [
  { name: "", paidAmount: "" },
  { name: "", paidAmount: "" },
];

export function MeetingFormPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const draft = useMeetingDraft((state) => state.draft);
  const setDraft = useMeetingDraft((state) => state.setDraft);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<MeetingFormInput, unknown, MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      name: draft?.meetingName ?? "",
      participants:
        draft === null
          ? INITIAL_PARTICIPANTS
          : draft.participants.map((participant) => ({
              name: participant.name,
              paidAmount: String(participant.paidAmount),
            })),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "participants" });

  useEffect(() => {
    if (draft !== null || user === null) {
      return;
    }

    if (getValues("participants.0.name") === "") {
      setValue("participants.0.name", user.name);
    }
  }, [draft, user, getValues, setValue]);

  const participantsError = errors.participants?.root?.message ?? errors.root?.message;

  function onSubmit(values: MeetingFormValues) {
    setDraft({ meetingName: resolveMeetingName(values.name), participants: values.participants });
    navigate("/reuniones/resumen");
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Nueva reunión</h1>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          htmlFor="meeting-name"
          label="Nombre de reunión"
          hint="(opcional)"
          error={errors.name?.message}
        >
          <Input
            id="meeting-name"
            placeholder="Asado del sábado"
            invalid={errors.name !== undefined}
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name ? "meeting-name-error" : undefined}
            className="w-full"
            {...register("name")}
          />
        </Field>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Participantes</h2>

          {fields.map((field, index) => (
            <ParticipantRow
              key={field.id}
              index={index}
              isSelf={index === 0}
              register={register}
              nameError={errors.participants?.[index]?.name?.message}
              amountError={errors.participants?.[index]?.paidAmount?.message}
              canRemove={index > 0 && fields.length > 2}
              onRemove={() => remove(index)}
            />
          ))}

          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => append({ name: "", paidAmount: "" })}
          >
            Agregar participante
          </Button>

          {participantsError !== undefined && (
            <p role="alert" className="text-sm text-rose-600">
              {participantsError}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" size="md" className="self-start">
          Calcular
        </Button>
      </form>
    </section>
  );
}
