import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { ParticipantRow } from "../components/participant-row";
import {
  meetingFormSchema,
  type MeetingFormInput,
  type MeetingFormValues,
} from "../schemas/meeting-form.schema";
import { useMeetingDraft } from "../store/meeting-draft";

const INITIAL_PARTICIPANTS: MeetingFormInput["participants"] = [
  { name: "", paidAmount: "" },
  { name: "", paidAmount: "" },
];

export function MeetingFormPage() {
  const navigate = useNavigate();
  const setDraft = useMeetingDraft((state) => state.setDraft);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MeetingFormInput, unknown, MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: { name: "", participants: INITIAL_PARTICIPANTS },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "participants" });

  const participantsError = errors.participants?.root?.message ?? errors.root?.message;

  function onSubmit(values: MeetingFormValues) {
    setDraft({ meetingName: values.name, participants: values.participants });
    navigate("/reuniones/resumen");
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nueva reunión</h1>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="meeting-name" className="text-sm font-medium">
            Nombre de reunión <span className="font-normal text-neutral-500">(opcional)</span>
          </label>
          <input
            id="meeting-name"
            placeholder="Asado del sábado"
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name ? "meeting-name-error" : undefined}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1"
            {...register("name")}
          />
          {errors.name !== undefined && (
            <p id="meeting-name-error" role="alert" className="text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

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

          <button
            type="button"
            onClick={() => append({ name: "", paidAmount: "" })}
            className="self-start rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            Agregar participante
          </button>

          {participantsError !== undefined && (
            <p role="alert" className="text-sm text-red-600">
              {participantsError}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="self-start rounded bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Calcular
        </button>
      </form>
    </section>
  );
}
