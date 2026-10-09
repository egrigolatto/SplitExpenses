import { Link, useSearchParams } from "react-router";

import { Button } from "../components/ui/button";
import { buttonClass } from "../components/ui/button-styles";
import { useMeetingsQuery } from "../hooks/use-meetings";
import { formatAmount, formatMeetingDate } from "../utils/format";

export function MeetingsPage() {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("page"));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;
  const { data, isPending, isError } = useMeetingsQuery(page);

  function goToPage(next: number) {
    setParams(next <= 1 ? {} : { page: String(next) });
  }

  if (isPending) {
    return (
      <p role="status" className="text-sm text-neutral-400">
        Cargando reuniones…
      </p>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Mis reuniones</h1>
        <p role="alert" className="text-sm text-rose-400">
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
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <Link
            to="/estadisticas"
            className="rounded-lg font-medium text-neutral-300 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400"
          >
            Estadísticas
          </Link>
          <Link to="/reuniones/nueva" className={buttonClass("secondary", "sm")}>
            Nueva reunión
          </Link>
        </div>
      </header>

      {items.length === 0 && (
        <p className="text-sm text-neutral-400">Todavía no guardaste ninguna reunión.</p>
      )}

      {items.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((meeting) => (
              <li
                key={meeting.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col">
                  <Link
                    to={`/mis-reuniones/${meeting.id}`}
                    className="break-words rounded-lg font-medium underline-offset-4 hover:text-brand-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400"
                  >
                    {meeting.name}
                  </Link>
                  <span className="text-sm text-neutral-400">
                    {formatMeetingDate(meeting.meetingDate)} · {meeting.participants.length}{" "}
                    {meeting.participants.length === 1 ? "participante" : "participantes"}
                  </span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-brand-300">
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
              onClick={() => goToPage(Math.max(1, page - 1))}
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
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
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
