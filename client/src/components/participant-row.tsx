import type { UseFormRegister } from "react-hook-form";

import type { MeetingFormInput } from "../schemas/meeting-form.schema";

interface ParticipantRowProps {
  index: number;
  isSelf: boolean;
  register: UseFormRegister<MeetingFormInput>;
  nameError?: string | undefined;
  amountError?: string | undefined;
  canRemove: boolean;
  onRemove: () => void;
}

const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1";

const invalidInputClass = "border-red-500";

export function ParticipantRow({
  index,
  isSelf,
  register,
  nameError,
  amountError,
  canRemove,
  onRemove,
}: ParticipantRowProps) {
  const participantLabel = isSelf ? "Yo" : `Participante ${index}`;
  const nameFieldId = `participant-name-${index}`;
  const amountFieldId = `participant-amount-${index}`;

  return (
    <div
      role="group"
      aria-label={participantLabel}
      className="flex items-start gap-3 rounded border border-neutral-200 bg-white p-3"
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={nameFieldId} className="text-sm font-medium">
            {participantLabel}
          </label>
          <input
            id={nameFieldId}
            placeholder={isSelf ? "tu nombre" : "nombre"}
            aria-invalid={nameError !== undefined}
            aria-describedby={nameError ? `${nameFieldId}-error` : undefined}
            className={`${inputClass} ${nameError ? invalidInputClass : ""}`}
            {...register(`participants.${index}.name`)}
          />
          {nameError !== undefined && (
            <p id={`${nameFieldId}-error`} role="alert" className="text-sm text-red-600">
              {nameError}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-40">
          <label htmlFor={amountFieldId} className="text-sm font-medium">
            Monto pagado
          </label>
          <input
            id={amountFieldId}
            type="text"
            inputMode="decimal"
            placeholder="$"
            aria-invalid={amountError !== undefined}
            aria-describedby={amountError ? `${amountFieldId}-error` : undefined}
            className={`${inputClass} ${amountError ? invalidInputClass : ""}`}
            {...register(`participants.${index}.paidAmount`)}
          />
          {amountError !== undefined && (
            <p id={`${amountFieldId}-error`} role="alert" className="text-sm text-red-600">
              {amountError}
            </p>
          )}
        </div>
      </div>

      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Eliminar ${participantLabel.toLowerCase()}`}
          className="shrink-0 rounded px-2 py-2 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1"
        >
          Eliminar
        </button>
      ) : (
        <span className="w-20 shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}
