import { describe, expect, it } from "vitest";

import { addMonthsToKey, buildMonthlySeries, monthKey } from "../../src/services/stats.service.js";
import { isValidTimeZone, zonedTodayParts } from "../../src/lib/timezone.js";

describe("timezone helpers", () => {
  it("aceja zonas validas y rechaza inventadas", () => {
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });

  it("calcula el dia en la zona horaria pedida", () => {
    const utcInstant = new Date("2026-01-01T02:00:00Z");

    expect(zonedTodayParts("UTC", utcInstant)).toEqual({ year: 2026, month: 1, day: 1 });
    expect(zonedTodayParts("America/Argentina/Buenos_Aires", utcInstant)).toEqual({
      year: 2025,
      month: 12,
      day: 31,
    });
  });
});

describe("month keys", () => {
  it("formatea con cero inicial", () => {
    expect(monthKey(2026, 3)).toBe("2026-03");
  });

  it("suma y resta meses cruzando el año", () => {
    expect(addMonthsToKey("2026-11", 2)).toBe("2027-01");
    expect(addMonthsToKey("2026-01", -1)).toBe("2025-12");
    expect(addMonthsToKey("2026-10", 0)).toBe("2026-10");
    expect(addMonthsToKey("2025-12", 13)).toBe("2027-01");
  });
});

describe("buildMonthlySeries", () => {
  it("rellena los meses sin datos con ceros y cubre 12 meses terminando en el actual", () => {
    const series = buildMonthlySeries(
      [
        { key: "2026-08", meetings: 1, amount: 100 },
        { key: "2026-10", meetings: 2, amount: 340 },
      ],
      "2026-10",
    );

    expect(series).toHaveLength(12);
    expect(series[0]?.key).toBe("2025-11");
    expect(series[0]).toEqual({ key: "2025-11", meetings: 0, amount: 0 });
    expect(series.find((row) => row.key === "2026-09")).toEqual({
      key: "2026-09",
      meetings: 0,
      amount: 0,
    });
    expect(series.at(-1)).toEqual({ key: "2026-10", meetings: 2, amount: 340 });
    expect(series.find((row) => row.key === "2026-08")?.amount).toBe(100);
  });
});
