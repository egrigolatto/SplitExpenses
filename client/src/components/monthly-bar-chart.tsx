import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { StatsMonth } from "../schemas/stats.schema";
import { formatAmount, formatMonthAxisLabel, formatMonthLabel } from "../utils/format";

interface MonthlyBarChartProps {
  data: StatsMonth[];
  animate: boolean;
}

function summarize(data: StatsMonth[]): string {
  return data
    .map((month) => {
      const base = `${formatMonthLabel(month.key)}: reuniones por ${formatAmount(month.amount)} (${
        month.meetings
      } ${month.meetings === 1 ? "reunión" : "reuniones"})`;
      const mine = `, vos pagaste ${formatAmount(month.myAmount)}`;

      return base + mine;
    })
    .join(". ");
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: StatsMonth }>;
}) {
  const month = payload?.[0]?.payload;

  if (!active || month === undefined) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm shadow-glow">
      <p className="font-medium text-white">{formatMonthLabel(month.key)}</p>
      <p className="tabular-nums text-neutral-300">
        Total: {formatAmount(month.amount)} ({month.meetings}{" "}
        {month.meetings === 1 ? "reunión" : "reuniones"})
      </p>
      <p className="tabular-nums text-brand-200">Pagaste: {formatAmount(month.myAmount)}</p>
    </div>
  );
}

export function MonthlyBarChart({ data, animate }: MonthlyBarChartProps) {
  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={`Gasto de los últimos 12 meses. ${summarize(data)}`}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap="-100%">
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="key"
              tickFormatter={formatMonthAxisLabel}
              stroke="#a49db8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#a49db8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={(value: unknown) => `$${String(value)}`}
            />
            <Tooltip cursor={{ fill: "rgba(167,139,250,0.08)" }} content={<ChartTooltip />} />
            <Bar
              dataKey="amount"
              name="Total de reuniones"
              fill="rgba(167,139,250,0.25)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
              isAnimationActive={animate}
            />
            <Bar
              dataKey="myAmount"
              name="Lo que pagaste"
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
              maxBarSize={16}
              isAnimationActive={animate}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-wrap items-center gap-4 text-xs text-neutral-400" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-[rgba(167,139,250,0.25)]" />
          Total de reuniones
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-brand-500" />
          Lo que pagaste
        </li>
      </ul>
    </div>
  );
}
