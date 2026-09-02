import { describe, expect, it } from "vitest";

import {
  normalizeNumericInput,
  normalizePersianText,
  parseNonNegativeInteger
} from "../../src/modules/tax/domain/normalization/persian";

describe("Persian tax-input normalization", () => {
  it("normalizes Arabic/Persian digits, characters, and whitespace", () => {
    expect(normalizePersianText("  مالياتِ  كالا ۱۲٣ ")).toBe("مالیاتِ کالا 123");
  });

  it("normalizes grouping and decimal separators without floating point", () => {
    expect(normalizeNumericInput("۱٬۲۳۴٬۵۶۷٫۸۹")).toBe("1234567.89");
    expect(parseNonNegativeInteger("۹٬۰۰۰٬۰۰۰٬۰۰۰٬۰۰۰٬۰۰۰")).toBe(9000000000000000n);
  });

  it("rejects decimal, signed, and non-numeric integer inputs", () => {
    expect(parseNonNegativeInteger("1.5")).toBeNull();
    expect(parseNonNegativeInteger("-1")).toBeNull();
    expect(parseNonNegativeInteger("دوازده")).toBeNull();
  });
});
