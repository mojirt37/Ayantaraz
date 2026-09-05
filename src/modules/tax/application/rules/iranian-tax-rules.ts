export const TAX_BASICS = {
  basicExemptionAnnualRials: 600_000_000n,
  taxYear: 1404,
  effectiveDate: "1403-04-01",
  sourceReference: "آیین‌نامه اجرایی قانون مالیات درآمد افراد طبیعی - ماده 53 قانون اساسی + اصلاحات ۱۴۰۴",
  engineVersion: "IR-TAX-1.0.0",
} as const;

export const INCOME_TAX_BRACKETS = [
  { min: 600_000_000n, max: 800_000_000n, rate: 0.10, label: "10%" },
  { min: 800_000_000n, max: 1_150_000_000n, rate: 0.15, label: "15%" },
  { min: 1_150_000_000n, max: 1_900_000_000n, rate: 0.20, label: "20%" },
  { min: 1_900_000_000n, max: 2_700_000_000n, rate: 0.25, label: "25%" },
  { min: 2_700_000_000n, max: 4_100_000_000n, rate: 0.30, label: "30%" },
  { min: 4_100_000_000n, max: 9_999_999_999_999n, rate: 0.35, label: "35%" },
] as const;

export const DEDUCTIONS = {
  mandatorySocialSecurityPercent: 0.075,
  housingRentMaxRials: 300_000_000n,
  healthInsuranceMaxRials: 100_000_000n,
  lifeInsuranceMaxRials: 50_000_000n,
  educationMaxRials: 50_000_000n,
  medicalExpenseMaxRials: 100_000_000n,
} as const;

export const VAT_RATE = 0.09;
export const WITHHOLDING_TAX_RATE = 0.10;
export const PROPERTY_TAX_RATE = 0.02;
export const CAPITAL_GAINS_RATE = 0.15;
export const DIGITAL_SERVICE_TAX_RATE = 0.09;

export function calculateTaxableIncome(params: {
  grossAnnualIncome: bigint;
  mandatorySocialSecurity: bigint;
  housingRent: bigint;
  healthInsurance: bigint;
  lifeInsurance: bigint;
  education: bigint;
  medicalExpenses: bigint;
}): bigint {
  const {
    grossAnnualIncome,
    mandatorySocialSecurity,
    housingRent,
    healthInsurance,
    lifeInsurance,
    education,
    medicalExpenses,
  } = params;

  const totalDeductions = mandatorySocialSecurity
    + (housingRent > DEDUCTIONS.housingRentMaxRials ? DEDUCTIONS.housingRentMaxRials : housingRent)
    + (healthInsurance > DEDUCTIONS.healthInsuranceMaxRials ? DEDUCTIONS.healthInsuranceMaxRials : healthInsurance)
    + (lifeInsurance > DEDUCTIONS.lifeInsuranceMaxRials ? DEDUCTIONS.lifeInsuranceMaxRials : lifeInsurance)
    + (education > DEDUCTIONS.educationMaxRials ? DEDUCTIONS.educationMaxRials : education)
    + (medicalExpenses > DEDUCTIONS.medicalExpenseMaxRials ? DEDUCTIONS.medicalExpenseMaxRials : medicalExpenses);

  const taxableIncome = grossAnnualIncome - totalDeductions;
  return taxableIncome < 0n ? 0n : taxableIncome;
}

export function calculateIncomeTax(taxableIncome: bigint): { tax: bigint; breakdown: string[] } {
  const breakdown: string[] = [];
  let remaining = taxableIncome;
  let totalTax = 0n;

  const exemption = TAX_BASICS.basicExemptionAnnualRials;
  if (taxableIncome <= exemption) {
    return { tax: 0n, breakdown: ["درآمد زیر سرکلیه نیست. مالیات واجب پرداخت: ۰ ریال"] };
  }

  remaining = taxableIncome - exemption;
  breakdown.push(`درآمد کار: ${taxableIncome.toString()} ریال | سرکلیه: ${exemption.toString()} ریال | مالیات‌خوردهای کسری: ${remaining.toString()} ریال`);

  for (const bracket of INCOME_TAX_BRACKETS) {
    if (remaining <= 0n) break;
    const bracketWidth = bracket.max - bracket.min;
    if (remaining >= bracketWidth) {
      const taxInBracket = (bracketWidth * BigInt(Math.round(bracket.rate * 10000))) / 10000n;
      totalTax += taxInBracket;
      breakdown.push(`${bracket.label} بر مبلغ ${bracketWidth.toString()} ریال = ${taxInBracket.toString()} ریال`);
      remaining -= bracketWidth;
    } else {
      const taxInBracket = (remaining * BigInt(Math.round(bracket.rate * 10000))) / 10000n;
      totalTax += taxInBracket;
      breakdown.push(`${bracket.label} بر مبلغ ${remaining.toString()} ریال = ${taxInBracket.toString()} ریال`);
      remaining = 0n;
    }
  }

  return { tax: totalTax, breakdown };
}

export function calculateMonthlyTax(grossMonthlyIncome: bigint): {
  monthlyTax: bigint;
  annualGross: bigint;
  taxableIncome: bigint;
  annualTax: bigint;
  breakdown: string[];
} {
  const annualGross = grossMonthlyIncome * 12n;
  const mandatorySS = (annualGross * BigInt(Math.round(DEDUCTIONS.mandatorySocialSecurityPercent * 10000))) / 10000n;
  const taxableIncome = calculateTaxableIncome({
    grossAnnualIncome: annualGross,
    mandatorySocialSecurity: mandatorySS,
    housingRent: DEDUCTIONS.housingRentMaxRials,
    healthInsurance: DEDUCTIONS.healthInsuranceMaxRials,
    lifeInsurance: DEDUCTIONS.lifeInsuranceMaxRials,
    education: 0n,
    medicalExpenses: 0n,
  });
  const { tax, breakdown } = calculateIncomeTax(taxableIncome);
  const monthlyTax = tax / 12n;
  return { monthlyTax, annualGross, taxableIncome, annualTax: tax, breakdown };
}
