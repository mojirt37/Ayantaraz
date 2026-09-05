import { calculateTaxableIncome, calculateIncomeTax } from "./rules/iranian-tax-rules";

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
