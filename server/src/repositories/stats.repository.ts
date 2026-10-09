import { and, count, eq, gte, lt, sql, type SQL } from "drizzle-orm";

import { db } from "../db/index.js";
import { meetings } from "../db/schema/meetings.js";
import { participants } from "../db/schema/participants.js";

export interface StatsAggregate {
  meetings: number;
  amount: number;
}

export interface StatsMonthRow extends StatsAggregate {
  key: string;
}

export interface StatsOwnMonthRow {
  key: string;
  amount: number;
}

const amountSum = sql<number>`coalesce(sum(${meetings.totalAmount}), 0)::float`;

export class StatsRepository {
  async getTotals(ownerId: string): Promise<StatsAggregate> {
    return this.aggregate(eq(meetings.ownerId, ownerId));
  }

  async getRangeTotals(ownerId: string, from: string, to: string): Promise<StatsAggregate> {
    return this.aggregate(
      and(
        eq(meetings.ownerId, ownerId),
        gte(meetings.meetingDate, from),
        lt(meetings.meetingDate, to),
      ),
    );
  }

  async getMonthlySeries(ownerId: string, from: string): Promise<StatsMonthRow[]> {
    const rows = await db
      .select({
        key: sql<string>`to_char(${meetings.meetingDate}, 'YYYY-MM')`,
        meetings: count(),
        amount: amountSum,
      })
      .from(meetings)
      .where(and(eq(meetings.ownerId, ownerId), gte(meetings.meetingDate, from)))
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    return rows.map((row) => ({
      key: row.key,
      meetings: Number(row.meetings),
      amount: Number(row.amount),
    }));
  }

  async getMyMonthlySeries(userId: string, from: string): Promise<StatsOwnMonthRow[]> {
    const rows = await db
      .select({
        key: sql<string>`to_char(${meetings.meetingDate}, 'YYYY-MM')`,
        amount: sql<number>`coalesce(sum(${participants.paidAmount}), 0)::float`,
      })
      .from(participants)
      .innerJoin(meetings, eq(participants.meetingId, meetings.id))
      .where(and(eq(participants.userId, userId), gte(meetings.meetingDate, from)))
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    return rows.map((row) => ({ key: row.key, amount: Number(row.amount) }));
  }

  async getMyTotal(userId: string): Promise<number> {
    const [row] = await db
      .select({
        amount: sql<number>`coalesce(sum(${participants.paidAmount}), 0)::float`,
      })
      .from(participants)
      .where(eq(participants.userId, userId));

    return Number(row?.amount ?? 0);
  }

  private async aggregate(where: SQL | undefined): Promise<StatsAggregate> {
    const [row] = await db
      .select({ meetings: count(), amount: amountSum })
      .from(meetings)
      .where(where);

    return { meetings: Number(row?.meetings ?? 0), amount: Number(row?.amount ?? 0) };
  }
}
