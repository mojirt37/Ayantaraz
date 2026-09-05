const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeRialsDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

export function parseRialsAmount(raw: string): bigint | null {
  try {
    const cleaned = normalizeRialsDigits(raw).replace(/[\s,٬]/g, "");
    if (!/^[0-9]+$/.test(cleaned)) return null;
    const value = BigInt(cleaned);
    if (value < 0n || value > 999_999_999_999_999n) return null;
    return value;
  } catch {
    return null;
  }
}
