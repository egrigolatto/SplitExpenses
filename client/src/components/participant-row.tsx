import type { UseFormRegister } from "react-hook-form";

import type { MeetingFormInput } from "../schemas/meeting-form.schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ParticipantRowProps {
  index: number;
  isSelf: boolean;
  register: UseFormRegister<MeetingFormInput>;
  nameError?: string | undefined;
  amountError?: string | undefined;
  canRemove: boolean;
  onRemove: () => void;
}

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
      className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900 p-3"
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={nameFieldId} className="text-sm font-medium">
            {participantLabel}
          </label>
          <Input
            id={nameFieldId}
            placeholder={isSelf ? "tu nombre…" : "nombre…"}
            invalid={nameError !== undefined}
            aria-invalid={nameError !== undefined}
            aria-describedby={nameError ? `${nameFieldId}-error` : undefined}
            className="w-full"
            {...register(`participants.${index}.name`)}
          />
          {nameError !== undefined && (
            <p id={`${nameFieldId}-error`} role="alert" className="text-sm text-rose-400">
              {nameError}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-40">
          <label htmlFor={amountFieldId} className="text-sm font-medium">
            Monto pagado
          </label>
          <Input
            id={amountFieldId}
            type="text"
            inputMode="decimal"
            placeholder="$…"
            invalid={amountError !== undefined}
            aria-invalid={amountError !== undefined}
            aria-describedby={amountError ? `${amountFieldId}-error` : undefined}
            className="w-full"
            {...register(`participants.${index}.paidAmount`)}
          />
          {amountError !== undefined && (
            <p id={`${amountFieldId}-error`} role="alert" className="text-sm text-rose-400">
              {amountError}
            </p>
          )}
        </div>
      </div>

      {canRemove ? (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Eliminar ${participantLabel.toLowerCase()}`}
          onClick={onRemove}
        >
          Eliminar
        </Button>
      ) : (
        <span className="w-24 shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}
