import type { TaxCalculationStore } from "./calculation-contract";

export type CalculationPreparation =
  | Readonly<{
      kind: "RULE_SELECTED";
      ruleVersionId: string;
      engineVersion: string;
      sourceReference: string;
    }>
  | Readonly<{ kind: "NO_PUBLISHED_RULE" }>;

export async function prepareCalculation(
  store: TaxCalculationStore,
  input: { taxType: string; effectiveDate: string }
): Promise<CalculationPreparation> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate) || input.taxType.trim().length === 0) {
    return { kind: "NO_PUBLISHED_RULE" };
  }
  const rule = await store.findPublishedRule(input);
  if (rule === null) return { kind: "NO_PUBLISHED_RULE" };
  if (
    input.effectiveDate < rule.effectiveFrom ||
    (rule.effectiveTo !== null && input.effectiveDate > rule.effectiveTo)
  ) {
    return { kind: "NO_PUBLISHED_RULE" };
  }
  return {
    kind: "RULE_SELECTED",
    ruleVersionId: rule.ruleVersionId,
    engineVersion: rule.engineVersion,
    sourceReference: rule.sourceReference
  };
}
