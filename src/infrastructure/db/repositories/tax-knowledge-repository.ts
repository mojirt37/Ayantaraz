import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import type { TaxCalculationStore, PublishedTaxRule } from "@/modules/tax/application/calculation-contract";
import { TAX_BASICS } from "@/modules/tax/application/rules/iranian-tax-rules";

export class PostgresTaxStore implements TaxCalculationStore {
  async findPublishedRule(input: { taxType: string; effectiveDate: string }): Promise<PublishedTaxRule | null> {
    const eff = new Date(input.effectiveDate);
    if (Number.isNaN(eff.getTime())) return null;
    const rows = await db
      .select()
      .from(S.taxRuleVersions)
      .innerJoin(S.taxRules, and(eq(S.taxRuleVersions.taxRuleId, S.taxRules.id), eq(S.taxRules.stableKey, input.taxType)))
      .where(and(eq(S.taxRuleVersions.status, "PUBLISHED"), lte(S.taxRuleVersions.effectiveFrom, eff)))
      .orderBy(desc(S.taxRuleVersions.effectiveFrom), desc(S.taxRuleVersions.version))
      .limit(10);
    const matching = rows.map((r) => r.tax_rule_versions).filter((r) => !r.effectiveTo || r.effectiveTo >= eff);
    const row = matching[0];
    if (!row) return null;
    return {
      ruleVersionId: row.id,
      engineVersion: TAX_BASICS.engineVersion,
      effectiveFrom: row.effectiveFrom.toISOString(),
      effectiveTo: row.effectiveTo?.toISOString() ?? null,
      sourceReference: row.sourceReference,
    };
  }

  async persistCalculation(input: {
    userId: string;
    ruleVersionId: string;
    engineVersion: string;
    effectiveDate: string;
    snapshot: { normalizedInput: Record<string, string>; output: Record<string, string>; disclaimer: string };
  }): Promise<void> {
    await db.insert(S.taxCalculations).values({
      userId: input.userId,
      taxRuleVersionId: input.ruleVersionId,
      engineVersion: input.engineVersion,
      effectiveDate: new Date(input.effectiveDate),
      inputSnapshot: input.snapshot.normalizedInput,
      outputSnapshot: input.snapshot.output,
      disclaimer: input.snapshot.disclaimer,
    });
  }
}

