import { describe, expect, it } from "vitest";

import { trustProxySchema } from "../../src/schemas/env.schema.js";

describe("TRUST_PROXY env parsing", () => {
  it("should accept a hop count", () => {
    expect(trustProxySchema.parse("1")).toBe(1);
    expect(trustProxySchema.parse("2")).toBe(2);
  });

  it("should treat empty or missing values as unset", () => {
    expect(trustProxySchema.parse("")).toBeUndefined();
    expect(trustProxySchema.parse(undefined)).toBeUndefined();
  });

  it("should reject invalid hop counts", () => {
    expect(() => trustProxySchema.parse("abc")).toThrow();
    expect(() => trustProxySchema.parse("-1")).toThrow();
    expect(() => trustProxySchema.parse("99")).toThrow();
  });
});
