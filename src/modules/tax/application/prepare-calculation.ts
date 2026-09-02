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
  const rule = await store.findPublishedRule(input);
  if (rule === null) return { kind: "NO_PUBLISHED_RULE" };
  return {
    kind: "RULE_SELECTED",
    ruleVersionId: rule.ruleVersionId,
    engineVersion: rule.engineVersion,
    sourceReference: rule.sourceReference
  };
}
