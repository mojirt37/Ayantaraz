import type { TaxCalculationStore } from "./calculation-contract";

export type CalculationPreparation =
  | Readonly<{
      kind: "RULE_SELECTED";
      ruleVersionId: string;
      engineVersion: string;
      sourceReference: string;
    }>
  | Readonly<{ kind: "INVALID_INPUT" }>
  | Readonly<{ kind: "NO_PUBLISHED_RULE" }>
  | Readonly<{ kind: "OUT_OF_EFFECTIVE_RANGE" }>
  | Readonly<{ kind: "MALFORMED_RULE" }>;

function isIsoCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isUsableRule(
  rule: Awaited<ReturnType<TaxCalculationStore["findPublishedRule"]>>
): boolean {
  return (
    rule !== null &&
    rule.ruleVersionId.trim().length > 0 &&
    rule.engineVersion.trim().length > 0 &&
    rule.sourceReference.trim().length > 0 &&
    isIsoCalendarDate(rule.effectiveFrom) &&
    (rule.effectiveTo === null || isIsoCalendarDate(rule.effectiveTo)) &&
    (rule.effectiveTo === null || rule.effectiveTo >= rule.effectiveFrom)
  );
}

export async function prepareCalculation(
  store: TaxCalculationStore,
  input: { taxType: string; effectiveDate: string }
): Promise<CalculationPreparation> {
  const taxType = input.taxType.trim();
  if (!isIsoCalendarDate(input.effectiveDate) || taxType.length === 0) {
    return { kind: "INVALID_INPUT" };
  }
  const rule = await store.findPublishedRule({ ...input, taxType });
  if (rule === null) return { kind: "NO_PUBLISHED_RULE" };
  if (!isUsableRule(rule)) return { kind: "MALFORMED_RULE" };
  if (
    input.effectiveDate < rule.effectiveFrom ||
    (rule.effectiveTo !== null && input.effectiveDate > rule.effectiveTo)
  ) {
    return { kind: "OUT_OF_EFFECTIVE_RANGE" };
  }
  return {
    kind: "RULE_SELECTED",
    ruleVersionId: rule.ruleVersionId,
    engineVersion: rule.engineVersion,
    sourceReference: rule.sourceReference
  };
}
