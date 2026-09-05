import { NextRequest, NextResponse } from "next/server";
import { computeTaxResult } from "@/modules/tax/application/calculate-tax";
import { PostgresTaxStore } from "@/infrastructure/db/repositories/tax-knowledge-repository";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => ({}));
  const grossStr = body.grossMonthlyIncome ?? body.grossAnnualIncome;
  if (!grossStr) return NextResponse.json({ error: "gross income required" }, { status: 400 });

  const gross = BigInt(grossStr.replace(/[\s,]/g, ""));
  const deductions = body.deductions ?? {};
  const result = computeTaxResult({
    userId: "user-1",
    taxType: "income",
    grossIncome: body.grossMonthlyIncome ? gross * 12n : gross,
    effectiveDate: new Date().toISOString(),
    deductions: {
      mandatorySocialSecurity: deductions.mandatorySocialSecurity ? BigInt(deductions.mandatorySocialSecurity.replace(/[\s,]/g, "")) : 0n,
      housingRent: deductions.housingRent ? BigInt(deductions.housingRent.replace(/[\s,]/g, "")) : 300_000_000n,
      healthInsurance: deductions.healthInsurance ? BigInt(deductions.healthInsurance.replace(/[\s,]/g, "")) : 100_000_000n,
      lifeInsurance: deductions.lifeInsurance ? BigInt(deductions.lifeInsurance.replace(/[\s,]/g, "")) : 50_000_000n,
      education: deductions.education ? BigInt(deductions.education.replace(/[\s,]/g, "")) : 0n,
      medicalExpenses: deductions.medicalExpenses ? BigInt(deductions.medicalExpenses.replace(/[\s,]/g, "")) : 0n,
    },
  });

  await persistCalculation("user-1", result);
  return NextResponse.json(result);
}

async function persistCalculation(userId: string, result: {
  grossIncome: bigint;
  taxableIncome: bigint;
  tax: bigint;
  monthlyTax: bigint;
  breakdown: string[];
  disclaimer: string;
}): Promise<void> {
  const store = new PostgresTaxStore();
  const rule = await store.findPublishedRule({ taxType: "income", effectiveDate: new Date().toISOString() });
  if (!rule) return;
  await store.persistCalculation({
    userId,
    ruleVersionId: rule.ruleVersionId,
    engineVersion: rule.engineVersion,
    effectiveDate: new Date().toISOString(),
    snapshot: {
      normalizedInput: { grossIncome: result.grossIncome.toString(), taxableIncome: result.taxableIncome.toString() },
      output: { tax: result.tax.toString(), monthlyTax: result.monthlyTax.toString(), breakdown: JSON.stringify(result.breakdown) },
      disclaimer: result.disclaimer,
    },
  });
}
