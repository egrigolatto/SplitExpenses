import { describe, expect, it } from "vitest";

import { formatAmount } from "./format";

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
