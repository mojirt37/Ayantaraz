import { describe, expect, it } from "vitest";
import { calculationInputHash, canonicalize } from "../../src/modules/tax/domain/calculation-hash";

describe("canonicalize", () => {
  it("orders keys deterministically", () => {
    expect(canonicalize({ b: "2", a: "1" })).toBe(canonicalize({ a: "1", b: "2" }));
  });

  it("distinguishes different values", () => {
    expect(canonicalize({ a: "1" })).not.toBe(canonicalize({ a: "2" }));
  });
});

describe("calculationInputHash", () => {
  it("is stable for identical inputs", () => {
    const a = calculationInputHash({ grossIncome: "1200000000", taxableIncome: "500000000" });
    const b = calculationInputHash({ taxableIncome: "500000000", grossIncome: "1200000000" });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when any field changes", () => {
    const a = calculationInputHash({ grossIncome: "1200000000" });
    const b = calculationInputHash({ grossIncome: "1200000001" });
    expect(a).not.toBe(b);
  });
});
