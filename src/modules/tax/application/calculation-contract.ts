export type PublishedTaxRule = Readonly<{
  ruleVersionId: string;
  engineVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReference: string;
}>;

export type TaxCalculationSnapshot = Readonly<{
  normalizedInput: Record<string, string>;
  output: Record<string, string>;
  disclaimer: string;
}>;

/**
 * Implementation boundary for the executable, source-approved tax engine.
 * No rule is selected or calculated until B-001 supplies actual legal inputs.
 */
export interface TaxCalculationStore {
  findPublishedRule(input: {
    taxType: string;
    effectiveDate: string;
  }): Promise<PublishedTaxRule | null>;
  persistCalculation(input: {
    userId: string;
    ruleVersionId: string;
    engineVersion: string;
    effectiveDate: string;
    snapshot: TaxCalculationSnapshot;
  }): Promise<void>;
}
