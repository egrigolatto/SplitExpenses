import { describe, expect, it } from "vitest";

import { formatAmount, formatDate, formatMeetingDate } from "./format";

describe("formatAmount", () => {
  it("formatea enteros con dos decimales", () => {
    expect(formatAmount(180)).toMatch(/\$\s?180,00$/);
  });

  it("formatea miles con separador de miles y decimales", () => {
    expect(formatAmount(1234.5)).toMatch(/\$\s?1\.234,50$/);
  });

  it("formatea cero", () => {
    expect(formatAmount(0)).toMatch(/\$\s?0,00$/);
  });
});

describe("formatMeetingDate", () => {
  it("convierte una fecha ISO a formato local dd/mm/aaaa", () => {
    expect(formatMeetingDate("2026-07-29")).toBe("29/07/2026");
  });

  it("no corre el dia por la zona horaria", () => {
    expect(formatMeetingDate("2026-01-05")).toBe("05/01/2026");
  });

  it("acepta un timestamp completo", () => {
    expect(formatMeetingDate("2026-07-29T00:00:00.000Z")).toBe("29/07/2026");
  });
});

describe("formatDate", () => {
  it("formatea una Date local", () => {
    expect(formatDate(new Date(2025, 9, 10))).toBe("10/10/2025");
  });
});
