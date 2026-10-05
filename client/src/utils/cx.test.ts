import { describe, expect, it } from "vitest";

import { cx } from "./cx";

describe("cx", () => {
  it("une solo las clases no vacías", () => {
    expect(cx("a", false, undefined, "b", null, "c")).toBe("a b c");
  });

  it("devuelve cadena vacía sin clases", () => {
    expect(cx(false, undefined)).toBe("");
  });
});
