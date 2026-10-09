import type { StatsResponse } from "../schemas/stats.schema.js";
import { zonedTodayParts } from "../lib/timezone.js";
import { StatsRepository, type StatsMonthRow } from "../repositories/stats.repository.js";

const SERIES_MONTHS = 12;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

export function addMonthsToKey(key: string, delta: number): string {
  const [yearPart, monthPart] = key.split("-");
  const total = Number(yearPart) * 12 + (Number(monthPart) - 1) + delta;
  const normalized = ((total % 12) + 12) % 12;

  return `${Math.floor(total / 12)}-${pad(normalized + 1)}`;
}

export function buildMonthlySeries(rows: StatsMonthRow[], endMonthKey: string): StatsMonthRow[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return Array.from({ length: SERIES_MONTHS }, (_, index) => {
    const key = addMonthsToKey(endMonthKey, index - (SERIES_MONTHS - 1));
    const found = byKey.get(key);

    return { key, meetings: found?.meetings ?? 0, amount: found?.amount ?? 0 };
  });
}

export class StatsService {
  constructor(private readonly repository: StatsRepository) {}

  async getStats(userId: string, timeZone = "UTC"): Promise<StatsResponse> {
    const { year, month } = zonedTodayParts(timeZone);
    const currentMonth = monthKey(year, month);

    const monthStart = `${currentMonth}-01`;
    const monthEnd = `${addMonthsToKey(currentMonth, 1)}-01`;
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;
    const seriesStart = `${addMonthsToKey(currentMonth, -(SERIES_MONTHS - 1))}-01`;

    const [total, monthTotals, yearTotals, monthlyRows] = await Promise.all([
      this.repository.getTotals(userId),
      this.repository.getRangeTotals(userId, monthStart, monthEnd),
      this.repository.getRangeTotals(userId, yearStart, yearEnd),
      this.repository.getMonthlySeries(userId, seriesStart),
    ]);

    return {
      total,
      current: {
        month: { key: currentMonth, ...monthTotals },
        year: { key: String(year), ...yearTotals },
      },
      averagePerMeeting: total.meetings === 0 ? 0 : total.amount / total.meetings,
      monthly: buildMonthlySeries(monthlyRows, currentMonth),
    };
  }
}
