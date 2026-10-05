import { useMemo } from "react";
import { Link, Navigate } from "react-router";

import { BalancesTable } from "../components/balances-table";
import { TransfersList } from "../components/transfers-list";
import { Button } from "../components/ui/button";
import { buttonClass } from "../components/ui/button-styles";
import { Card } from "../components/ui/card";
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
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1 pt-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {draft.meetingName === "" ? "Resumen" : draft.meetingName}
        </h1>
        <p className="text-sm text-neutral-600">
          Total gastado:{" "}
          <strong className="font-semibold tabular-nums text-neutral-900">
            {formatAmount(result.totalAmount)}
          </strong>
          {" · "}
          {result.balances.length} participantes
        </p>
      </header>

      <Card tone="dark" className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Saldos</h2>
        <BalancesTable balances={result.balances} dark />
      </Card>

      <Card tone="dark" className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          Transferencias
          {result.transfers.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-400">
              ({result.transfers.length})
            </span>
          )}
        </h2>
        <TransfersList transfers={result.transfers} dark />
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/reuniones/nueva" className={buttonClass("secondary", "sm")}>
            Volver a editar
          </Link>
          <Link to="/" onClick={clearDraft} className={buttonClass("secondary", "sm")}>
            Empezar de nuevo
          </Link>

          {user !== null &&
            (saveMeeting.isSuccess ? (
              <p role="status" className="text-sm font-medium text-emerald-700">
                Reunión guardada.{" "}
                <Link
                  to="/mis-reuniones"
                  className="underline underline-offset-4 hover:text-emerald-800"
                >
                  Ver en Mis reuniones
                </Link>
              </p>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={saveMeeting.isPending}
                onClick={() => saveMeeting.mutate(buildCreateMeetingRequest(draft))}
              >
                {saveMeeting.isPending ? "Guardando..." : "Guardar reunión"}
              </Button>
            ))}
        </div>

        {user === null && (
          <p className="text-sm text-neutral-600">
            <Link
              to="/login"
              className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
            >
              Iniciá sesión
            </Link>{" "}
            para guardar esta reunión en tu historial.
          </p>
        )}

        {saveMeeting.error !== null && (
          <p role="alert" className="text-sm text-rose-600">
            {describeSaveError(saveMeeting.error)}
          </p>
        )}
      </div>
    </section>
  );
}
