import { describe, expect, it } from "vitest";

import { resolveMeetingName } from "./meeting-name";

const FIXED_DATE = new Date(2025, 9, 10);

describe("resolveMeetingName", () => {
  it("conserva el nombre informado por el usuario", () => {
    expect(resolveMeetingName("Asado del sábado", FIXED_DATE)).toBe("Asado del sábado");
  });

  it("recorta el nombre antes de decidir", () => {
    expect(resolveMeetingName("  Cena  ", FIXED_DATE)).toBe("Cena");
  });

  it("genera un nombre con la fecha cuando viene vacio", () => {
    expect(resolveMeetingName("", FIXED_DATE)).toBe("Reunión 10/10/2025");
  });

  it("trata los espacios como vacio", () => {
    expect(resolveMeetingName("   ", FIXED_DATE)).toBe("Reunión 10/10/2025");
  });
});
