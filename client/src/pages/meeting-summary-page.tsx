import { useMemo } from "react";
import { Link, Navigate } from "react-router";

import { BalancesTable } from "../components/balances-table";
import { TransfersList } from "../components/transfers-list";
import { useMeetingDraft } from "../store/meeting-draft";
import { formatAmount } from "../utils/format";
import { splitExpenses } from "../utils/split-expenses";

export function MeetingSummaryPage() {
  const draft = useMeetingDraft((state) => state.draft);
  const clearDraft = useMeetingDraft((state) => state.clearDraft);

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

      <div className="flex gap-3">
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
      </div>
    </section>
  );
}
