import { Link } from "react-router";

import { Card } from "../components/ui/card";
import { MonthlyBarChart } from "../components/monthly-bar-chart";
import { buttonClass } from "../components/ui/button-styles";
import { Button } from "../components/ui/button";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { useStatsQuery } from "../hooks/use-stats";
import { formatAmount, formatMonthLabel } from "../utils/format";

function meetingsLabel(count: number): string {
  return `${count} ${count === 1 ? "reunión" : "reuniones"}`;
}

interface StatsCardProps {
  label: string;
  value: string;
  hint?: string | undefined;
}

function StatsCard({ label, value, hint }: StatsCardProps) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-xs text-neutral-400 sm:text-sm">{label}</span>
      <span className="text-xl font-bold tabular-nums text-white sm:text-2xl">{value}</span>
      {hint !== undefined && <span className="text-xs text-neutral-400">{hint}</span>}
    </Card>
  );
}

export function StatsPage() {
  const reducedMotion = useReducedMotion();
  const { data, isPending, isError, isFetching, refetch } = useStatsQuery();

  if (isPending) {
    return (
      <section className="flex flex-col gap-6" aria-busy="true">
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
        <p role="status" className="sr-only">
          Cargando estadísticas…
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Card
              key={index}
              aria-hidden="true"
              className={`h-24 ${reducedMotion ? "" : "animate-pulse"}`}
            />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
        <p role="alert" className="text-sm text-rose-400">
          No se pudieron cargar las estadísticas. Intentá de nuevo.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Reintentar
        </Button>
      </section>
    );
  }

  if (data.total.meetings === 0) {
    return (
      <section className="flex flex-col items-start gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
        <p className="text-sm text-neutral-400">
          Todavía no guardaste ninguna reunión. Cuando guardes la primera, acá vas a ver tus totales
          y la evolución del gasto mes a mes.
        </p>
        <Link to="/reuniones/nueva" className={buttonClass("primary", "sm")}>
          Nueva reunión
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsCard label="Reuniones guardadas" value={String(data.total.meetings)} />
        <StatsCard
          label="Gastado total"
          value={formatAmount(data.total.amount)}
          hint={`Vos pagaste ${formatAmount(data.total.myAmount)}`}
        />
        <StatsCard
          label={formatMonthLabel(data.current.month.key)}
          value={formatAmount(data.current.month.amount)}
          hint={meetingsLabel(data.current.month.meetings)}
        />
        <StatsCard
          label={`Año ${data.current.year.key}`}
          value={formatAmount(data.current.year.amount)}
          hint={meetingsLabel(data.current.year.meetings)}
        />
      </div>

      <Card tone="accent" className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Últimos 12 meses</h2>
          <p className="text-sm text-neutral-400">
            Promedio por reunión:{" "}
            <strong className="font-semibold tabular-nums text-neutral-100">
              {formatAmount(data.averagePerMeeting)}
            </strong>
          </p>
        </div>
        <MonthlyBarChart data={data.monthly} animate={!reducedMotion} />
      </Card>
    </section>
  );
}
