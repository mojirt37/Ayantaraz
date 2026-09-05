import { calculateTaxableIncome, calculateIncomeTax } from "./rules/iranian-tax-rules";
import { TAX_1405_BASICS, calculateIncomeTax1405 } from "./rules/iranian-tax-rules-1405";

export const SUPPORTED_TAX_YEARS = [1404, 1405] as const;
export type SupportedTaxYear = (typeof SUPPORTED_TAX_YEARS)[number];

export function computeTaxResult(params: {
  userId: string;
  taxType: string;
  grossIncome: bigint;
  effectiveDate: string;
  taxYear?: SupportedTaxYear;
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
  taxYear: SupportedTaxYear;
  engineVersion: string;
  sourceReference: string;
  breakdown: string[];
  disclaimer: string;
} {
  const { grossIncome, deductions, taxYear = 1404 } = params;
  if (taxYear === 1405) {
    // Budget Law 1405: exemption applies to gross salary directly; no separate
    // deduction schedule is sourced, so none is applied — stated in breakdown.
    const { tax, breakdown } = calculateIncomeTax1405(grossIncome);
    return {
      grossIncome,
      taxableIncome: grossIncome,
      tax,
      monthlyTax: tax / 12n,
      taxYear,
      engineVersion: TAX_1405_BASICS.engineVersion,
      sourceReference: TAX_1405_BASICS.sourceReference,
      breakdown,
      disclaimer:
        "نتیجه بر اساس قانون بودجه سال ۱۴۰۵ (سقف معافیت و نرخ‌های پلکانی مالیات حقوق) صرفاً اطلاع‌رسانی است و مشاوره مالیاتی محسوب نمی‌شود. محاسبه قطعی با سازمان امور مالیاتی کشور است.",
    };
  }
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
    taxYear,
    engineVersion: "IR-TAX-1.0.0",
    sourceReference: "آیین‌نامه مالیات درآمد ۱۴۰۴",
    breakdown,
    disclaimer: "نتیجه بر اساس آیین‌نامه مالیات درآمد افراد طبیعی ۱۴۰۴ محاسبه شده و صرفاً اطلاع‌رسانی است. توصیه به مراجعه به مهری یا حسابدار قانونی برای تأیید نهایی. محاسبه قطعی توسط سازمان مالیات‌تخلف‌های کشور است.",
  };
}
