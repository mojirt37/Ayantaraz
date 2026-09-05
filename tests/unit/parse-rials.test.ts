import { describe, expect, it } from "vitest";
import { parseRialsAmount } from "../../src/modules/tax/domain/parse-rials";

describe("parseRialsAmount", () => {
  it("parses plain digits", () => {
    expect(parseRialsAmount("1500000000")).toBe(1500000000n);
  });

  it("strips separators", () => {
    expect(parseRialsAmount("1,500,000,000")).toBe(1500000000n);
    expect(parseRialsAmount("1٬500٬000٬000")).toBe(1500000000n);
  });

  it("normalizes Persian digits", () => {
    expect(parseRialsAmount("۱۵۰۰۰۰۰۰۰۰")).toBe(1500000000n);
  });

  it("rejects non-numeric input", () => {
    expect(parseRialsAmount("abc")).toBeNull();
    expect(parseRialsAmount("12.5")).toBeNull();
    expect(parseRialsAmount("-100")).toBeNull();
    expect(parseRialsAmount("")).toBeNull();
  });

  it("rejects out-of-range values", () => {
    expect(parseRialsAmount("9999999999999999")).toBeNull();
  });
});
