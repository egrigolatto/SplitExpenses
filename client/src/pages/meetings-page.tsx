import { useState } from "react";
import { Link } from "react-router";

import { Button } from "../components/ui/button";
import { buttonClass } from "../components/ui/button-styles";
import { useMeetingsQuery } from "../hooks/use-meetings";
import { formatAmount, formatMeetingDate } from "../utils/format";

export function MeetingsPage() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useMeetingsQuery(page);

  if (isPending) {
    return (
      <p role="status" className="text-sm text-neutral-600">
        Cargando reuniones...
      </p>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Mis reuniones</h1>
        <p role="alert" className="text-sm text-rose-600">
          No se pudieron obtener las reuniones. Intentá de nuevo.
        </p>
      </section>
    );
  }

  const { items, totalPages, total } = data;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Mis reuniones</h1>
        <Link to="/reuniones/nueva" className={buttonClass("secondary", "sm")}>
          Nueva reunión
        </Link>
      </header>

      {items.length === 0 && (
        <p className="text-sm text-neutral-600">Todavía no guardaste ninguna reunión.</p>
      )}

      {items.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((meeting) => (
              <li
                key={meeting.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
              >
                <div className="flex flex-col">
                  <Link
                    to={`/mis-reuniones/${meeting.id}`}
                    className="rounded-lg font-medium underline-offset-4 hover:text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
                  >
                    {meeting.name}
                  </Link>
                  <span className="text-sm text-neutral-500">
                    {formatMeetingDate(meeting.meetingDate)} · {meeting.participants.length}{" "}
                    {meeting.participants.length === 1 ? "participante" : "participantes"}
                  </span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-brand-800">
                  {formatAmount(meeting.totalAmount)}
                </span>
              </li>
            ))}
          </ul>

          <nav
            aria-label="Paginación de reuniones"
            className="flex items-center justify-between gap-3 text-sm"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span aria-live="polite">
              Página {page} de {totalPages} · {total} reuniones
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
