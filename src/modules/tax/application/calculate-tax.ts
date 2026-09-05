import type { TaxCalculationStore, TaxCalculationSnapshot } from "./calculation-contract";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { calculateTaxableIncome, calculateIncomeTax } from "./rules/iranian-tax-rules";
import { TAX_BASICS } from "./rules/iranian-tax-rules";
import type { PublishedTaxRule } from "./calculation-contract";

export class PostgresTaxStore implements TaxCalculationStore {
  async findPublishedRule(input: { taxType: string; effectiveDate: string }): Promise<PublishedTaxRule | null> {
    const rows = await db.select().from(S.taxRuleVersions).limit(1);
    const row = rows[0];
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
    snapshot: TaxCalculationSnapshot;
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

export function computeTaxResult(params: {
  userId: string;
  taxType: string;
  grossIncome: bigint;
  effectiveDate: string;
  deductions: {
    mandatorySocialSecurity: bigint;
    housingRent: bigint;
    healthInsurance: bigint;
    lifeInsurance: bigint;
    education: bigint;
    medicalExpenses: bigint;
  };
}): {
  grossIncome: bigint;
  taxableIncome: bigint;
  tax: bigint;
  monthlyTax: bigint;
  breakdown: string[];
  disclaimer: string;
} {
  const { grossIncome, deductions } = params;
  const taxableIncome = calculateTaxableIncome({
    grossAnnualIncome: grossIncome,
    mandatorySocialSecurity: deductions.mandatorySocialSecurity,
    housingRent: deductions.housingRent,
    healthInsurance: deductions.healthInsurance,
    lifeInsurance: deductions.lifeInsurance,
    education: deductions.education,
    medicalExpenses: deductions.medicalExpenses,
  });
  const { tax, breakdown } = calculateIncomeTax(taxableIncome);
  const monthlyTax = tax / 12n;
  return {
    grossIncome,
    taxableIncome,
    tax,
    monthlyTax,
    breakdown,
    disclaimer: "نتیجه بر اساس آیین‌نامه مالیات درآمد افراد طبیعی ۱۴۰۴ محاسبه شده و صرفاً اطلاع‌رسانی است. توصیه به مراجعه به مهری یا حسابدار قانونی برای تأیید نهایی. محاسبه قطعی توسط سازمان مالیات‌تخلف‌های کشور است.",
  };
}
