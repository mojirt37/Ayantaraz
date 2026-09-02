const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string): string {
  return Array.from(value, (character) => {
    const persianIndex = persianDigits.indexOf(character);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = arabicDigits.indexOf(character);
    if (arabicIndex >= 0) return String(arabicIndex);
    return character;
  }).join("");
}

export function normalizePersianText(value: string): string {
  return normalizeDigits(value)
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    .replace(/[\u200c\u200f\u202a-\u202e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNumericInput(value: string): string {
  return normalizeDigits(value)
    .replace(/[٬,\s]/g, "")
    .replace(/٫/g, ".")
    .trim();
}

export function parseNonNegativeInteger(value: string): bigint | null {
  const normalized = normalizeNumericInput(value);
  if (!/^\d+$/.test(normalized)) return null;
  return BigInt(normalized);
}
