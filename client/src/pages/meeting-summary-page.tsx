import { useMemo } from "react";
import { Link, Navigate } from "react-router";

import { BalancesTable } from "../components/balances-table";
import { TransfersList } from "../components/transfers-list";
import { useSaveMeetingMutation } from "../hooks/use-meetings";
import { useSession } from "../hooks/use-session";
import { ApiRequestError } from "../services/http-client";
import { useMeetingDraft } from "../store/meeting-draft";
import { formatAmount } from "../utils/format";
import { buildCreateMeetingRequest } from "../utils/meeting-payload";
import { splitExpenses } from "../utils/split-expenses";

function describeSaveError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return "Iniciá sesión para guardar la reunión";
    }

    if (error.status === 400) {
      return "Los montos no coinciden con el total de la reunión";
    }

    if (error.status === 0) {
      return "No se pudo conectar con el servidor";
    }
  }

  return "No se pudo guardar la reunión. Intentá de nuevo";
}

export function MeetingSummaryPage() {
  const draft = useMeetingDraft((state) => state.draft);
  const clearDraft = useMeetingDraft((state) => state.clearDraft);
  const { user } = useSession();
  const saveMeeting = useSaveMeetingMutation();

  const result = useMemo(
    () => (draft === null ? null : splitExpenses(draft.participants)),
    [draft],
  );

  if (draft === null || result === null) {
    return <Navigate to="/reuniones/nueva" replace />;
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          {draft.meetingName === "" ? "Resumen" : draft.meetingName}
        </h1>
        <p className="text-sm text-neutral-600">
          Total gastado: <strong>{formatAmount(result.totalAmount)}</strong>
          {" · "}
          {result.balances.length} participantes
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Saldos</h2>
        <BalancesTable balances={result.balances} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Transferencias
          {result.transfers.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-500">
              ({result.transfers.length})
            </span>
          )}
        </h2>
        <TransfersList transfers={result.transfers} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/reuniones/nueva"
            className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            Volver a editar
          </Link>
          <Link
            to="/"
            onClick={clearDraft}
            className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            Empezar de nuevo
          </Link>

          {user !== null &&
            (saveMeeting.isSuccess ? (
              <p role="status" className="text-sm font-medium text-green-700">
                Reunión guardada.{" "}
                <Link to="/mis-reuniones" className="underline">
                  Ver en Mis reuniones
                </Link>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => saveMeeting.mutate(buildCreateMeetingRequest(draft))}
                disabled={saveMeeting.isPending}
                className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
              >
                {saveMeeting.isPending ? "Guardando..." : "Guardar reunión"}
              </button>
            ))}
        </div>

        {user === null && (
          <p className="text-sm text-neutral-600">
            <Link to="/login" className="font-medium underline">
              Iniciá sesión
            </Link>{" "}
            para guardar esta reunión en tu historial.
          </p>
        )}

        {saveMeeting.error !== null && (
          <p role="alert" className="text-sm text-red-600">
            {describeSaveError(saveMeeting.error)}
          </p>
        )}
      </div>
    </section>
  );
}
