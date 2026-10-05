import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";

import { BalancesTable } from "../components/balances-table";
import { MeetingNameEditor } from "../components/meeting-name-editor";
import { TransfersList } from "../components/transfers-list";
import { Button } from "../components/ui/button";
import { buttonClass } from "../components/ui/button-styles";
import { Card } from "../components/ui/card";
import {
  useDeleteMeetingMutation,
  useMeetingQuery,
  useRenameMeetingMutation,
} from "../hooks/use-meetings";
import type { MeetingWithParticipants } from "../schemas/meeting.schema";
import { ApiRequestError } from "../services/http-client";
import { formatAmount, formatMeetingDate } from "../utils/format";
import { splitExpenses } from "../utils/split-expenses";

function describeSaveError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    }

    if (error.status === 404) {
      return "La reunión ya no existe.";
    }

    if (error.status === 0) {
      return "No se pudo conectar con el servidor";
    }
  }

  return "No se pudo guardar el cambio. Intentá de nuevo";
}

function MeetingDetail({ meeting }: { meeting: MeetingWithParticipants }) {
  const navigate = useNavigate();
  const rename = useRenameMeetingMutation(meeting.id);
  const remove = useDeleteMeetingMutation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const split = useMemo(
    () =>
      splitExpenses(
        meeting.participants.map((participant) => ({
          name: participant.name,
          paidAmount: participant.paidAmount,
        })),
      ),
    [meeting.participants],
  );

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <MeetingNameEditor
          name={meeting.name}
          isPending={rename.isPending}
          onRename={(name) => rename.mutate(name)}
        />
        <p className="text-sm text-neutral-600">
          {formatMeetingDate(meeting.meetingDate)} ·{" "}
          <strong className="font-semibold tabular-nums text-neutral-900">
            {formatAmount(split.totalAmount)}
          </strong>{" "}
          · {meeting.participants.length}{" "}
          {meeting.participants.length === 1 ? "participante" : "participantes"}
        </p>
        {rename.error !== null && (
          <p role="alert" className="text-sm text-rose-600">
            {describeSaveError(rename.error)}
          </p>
        )}
      </header>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-lg font-semibold">Saldos</h2>
        <BalancesTable balances={split.balances} />
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-lg font-semibold">
          Transferencias
          {split.transfers.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-500">
              ({split.transfers.length})
            </span>
          )}
        </h2>
        <TransfersList transfers={split.transfers} />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Link to="/mis-reuniones" className={buttonClass("secondary", "sm")}>
          Volver al historial
        </Link>

        {confirmingDelete ? (
          <div
            role="group"
            aria-label="Confirmación de eliminación"
            className="flex items-center gap-2 text-sm"
          >
            <span className="font-medium">
              ¿Eliminar esta reunión? Esta acción no se puede deshacer.
            </span>
            <Button
              variant="danger"
              size="sm"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(meeting.id, { onSuccess: () => navigate("/mis-reuniones") })
              }
            >
              {remove.isPending ? "Eliminando..." : "Confirmar eliminación"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="dangerOutline" size="sm" onClick={() => setConfirmingDelete(true)}>
            Eliminar reunión
          </Button>
        )}

        {remove.error !== null && (
          <p role="alert" className="w-full text-sm text-rose-600">
            {describeSaveError(remove.error)}
          </p>
        )}
      </div>
    </section>
  );
}

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError } = useMeetingQuery(id ?? "");

  if (id === undefined) {
    return <Navigate to="/mis-reuniones" replace />;
  }

  if (isPending) {
    return (
      <p role="status" className="text-sm text-neutral-600">
        Cargando reunión...
      </p>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Reunión</h1>
        <p role="alert" className="text-sm text-rose-600">
          No se pudo cargar la reunión. Puede que ya no exista.
        </p>
        <Link to="/mis-reuniones" className={buttonClass("secondary", "sm", "self-start")}>
          Volver al historial
        </Link>
      </section>
    );
  }

  return <MeetingDetail meeting={data} />;
}
