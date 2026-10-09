import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../src/db/index.js";
import { meetings } from "../../src/db/schema/meetings.js";
import { zonedTodayParts } from "../../src/lib/timezone.js";
import { addMonthsToKey, monthKey } from "../../src/services/stats.service.js";
import { cleanDatabase, registerAndLogin, request } from "../helpers.js";

async function seedMeeting(
  ownerId: string,
  meetingDate: string,
  totalAmount: string,
  name = "Seed",
) {
  await db.insert(meetings).values({ ownerId, name, meetingDate, totalAmount });
}

function currentKeys() {
  const { year, month } = zonedTodayParts("UTC");

  return { yearKey: String(year), monthKey: monthKey(year, month) };
}

describe("Stats endpoint", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("GET /api/v1/stats", () => {
    it("aggregates totals, current period and a gap-filled 12-month series", async () => {
      const { agent, id } = await registerAndLogin();
      const { yearKey, monthKey: currentMonth } = currentKeys();
      const twoMonthsAgo = addMonthsToKey(currentMonth, -2);
      const lastYearJune = `${Number(yearKey) - 1}-06`;

      await seedMeeting(id!, `${currentMonth}-08`, "340.50", "Mes actual");
      await seedMeeting(id!, `${twoMonthsAgo}-14`, "100", "Hace dos meses");
      await seedMeeting(id!, `${lastYearJune}-15`, "200", "Año pasado");

      const res = await agent.get("/api/v1/stats?tz=UTC").expect(200);

      expect(res.body).toHaveProperty("success", true);
      const data = res.body.data;

      expect(data.total).toMatchObject({ meetings: 3, amount: 640.5 });
      expect(data.current.month).toMatchObject({ key: currentMonth, meetings: 1, amount: 340.5 });
      expect(data.current.year.key).toBe(yearKey);
      expect(data.current.year.meetings).toBe(2);
      expect(data.averagePerMeeting).toBeCloseTo(640.5 / 3, 5);

      expect(data.monthly).toHaveLength(12);
      expect(data.monthly[0]?.key).toBe(addMonthsToKey(currentMonth, -11));
      expect(data.monthly.at(-1)).toMatchObject({ key: currentMonth, meetings: 1 });
      expect(data.monthly.find((row: { key: string }) => row.key === twoMonthsAgo)?.amount).toBe(
        100,
      );
      expect(
        data.monthly.find((row: { key: string }) => row.key === addMonthsToKey(currentMonth, -1))
          ?.meetings,
      ).toBe(0);
    });

    it("returns zeros without meetings", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.get("/api/v1/stats?tz=UTC").expect(200);
      const data = res.body.data;

      expect(data.total).toEqual({ meetings: 0, amount: 0 });
      expect(data.current.month.meetings).toBe(0);
      expect(data.current.year.meetings).toBe(0);
      expect(data.averagePerMeeting).toBe(0);
      expect(data.monthly.every((row: { meetings: number; amount: number }) => row.meetings === 0));
    });

    it("does not leak stats of other users", async () => {
      const first = await registerAndLogin();
      const second = await registerAndLogin();

      await seedMeeting(first.id!, "2026-05-10", "500");

      const res = await second.agent.get("/api/v1/stats?tz=UTC").expect(200);

      expect(res.body.data.total).toEqual({ meetings: 0, amount: 0 });
    });

    it("requires authentication", async () => {
      const res = await request.get("/api/v1/stats").expect(401);

      expect(res.body).toMatchObject({ success: false });
    });

    it("rejects an invalid time zone with 400", async () => {
      const { agent } = await registerAndLogin();

      const res = await agent.get("/api/v1/stats?tz=Mars/Olympus_Mons").expect(400);

      expect(res.body).toMatchObject({ success: false, message: "Validation failed" });
      expect(res.body.errors?.[0]?.field).toBe("tz");
    });
  });
});
