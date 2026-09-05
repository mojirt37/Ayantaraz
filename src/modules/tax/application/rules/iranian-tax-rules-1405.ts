/**
 * Iranian salary/income tax rules for tax year 1405.
 *
 * Sourced from the Budget Law of 1405 (قانون بودجه سال ۱۴۰۵ کل کشور) as
 * published, cross-checked against the Direct Taxation Act (قانون
 * مالیات‌های مستقیم) articles 82 (taxable salary), 86 (employer withholding
 * duty) and 91 (exemptions):
 * - Monthly exemption: 40,000,000 Toman (400,000,000 Rials)
 * - Annual exemption: 480,000,000 Toman (4,800,000,000 Rials)
 * - Progressive rates on the excess: 10% / 15% / 20% / 25% / 30%
 * - Late-list penalty: 2% of paid salary; non-payment: 10% of unpaid tax;
 *   delay: 2.5% per month from the due date.
 *
 * The 1404 rule set in ./iranian-tax-rules.ts is intentionally left untouched:
 * published rule versions are immutable; a new year is a new version.
 */

export const TAX_1405_BASICS = {
  basicExemptionAnnualRials: 4_800_000_000n,
  basicExemptionMonthlyRials: 400_000_000n,
  taxYear: 1405,
  effectiveDate: "1404-01-01",
  sourceReference: "قانون بودجه سال ۱۴۰۵ کل کشور — سقف معافیت و نرخ‌های پلکانی مالیات حقوق؛ مواد ۸۲، ۸۶ و ۹۱ قانون مالیات‌های مستقیم",
  engineVersion: "IR-TAX-2.0.0",
} as const;

/** Annual brackets in Rials; each rate applies only to its own band (marginal). */
export const INCOME_TAX_BRACKETS_1405 = [
  { min: 4_800_000_000n, max: 9_600_000_000n, rate: 0.10, label: "۱۰٪" },
  { min: 9_600_000_000n, max: 12_000_000_000n, rate: 0.15, label: "۱۵٪" },
  { min: 12_000_000_000n, max: 14_400_000_000n, rate: 0.20, label: "۲۰٪" },
  { min: 14_400_000_000n, max: 16_800_000_000n, rate: 0.25, label: "۲۵٪" },
  { min: 16_800_000_000n, max: 99_999_999_999_999n, rate: 0.30, label: "۳۰٪" },
] as const;

/** Monthly brackets in Rials (annual ÷ 12), for payslip-level explanation. */
export const MONTHLY_TAX_BRACKETS_1405 = [
  { min: 400_000_000n, max: 800_000_000n, rate: 0.10, label: "۱۰٪" },
  { min: 800_000_000n, max: 1_000_000_000n, rate: 0.15, label: "۱۵٪" },
  { min: 1_000_000_000n, max: 1_200_000_000n, rate: 0.20, label: "۲۰٪" },
  { min: 1_200_000_000n, max: 1_400_000_000n, rate: 0.25, label: "۲۵٪" },
  { min: 1_400_000_000n, max: 9_999_999_999_999n, rate: 0.30, label: "۳۰٪" },
] as const;

export const TAX_1405_PENALTIES = {
  lateListPercent: 0.02,
  lateListBase: "۲٪ حقوق پرداختی در صورت عدم ارائه لیست در موعد مقرر",
  nonPaymentPercent: 0.10,
  nonPaymentBase: "۱۰٪ مالیات پرداخت‌نشده در صورت عدم پرداخت به‌موقع",
  delayMonthlyPercent: 0.025,
  delayBase: "۲٫۵٪ مالیات به ازای هر ماه تأخیر از تاریخ سررسید",
} as const;

/** Exempt items per article 91 DTA and the 1405 budget notes (descriptive, not computed). */
export const TAX_1405_EXEMPT_ITEMS = [
  "حقوق بازنشستگی، وظیفه و مستمری (ماده ۹۱)",
  "سنوات پایان خدمت و خسارت اخراج",
  "عیدی و پاداش پایان سال تا سقف یک‌دوازدهم معافیت سالانه (۴۰ میلیون تومان)",
  "هزینه‌های واقعی سفر و فوق‌العاده مأموریت",
  "مزایای غیرنقدی تا سقف دو دوازدهم معافیت سالانه (۸۰ میلیون تومان)",
  "حق اولاد (کمک‌هزینه عائله‌مندی)",
  "بازخرید ایام مرخصی استفاده‌نشده",
  "حقوق نیروهای مسلح (معافیت‌های خاص)",
] as const;

export const TAX_1405_WITHHOLDING_NOTE =
  "طبق ماده ۸۶ قانون مالیات‌های مستقیم، مالیات حقوق از نوع تکلیفی است: کارفرما موظف است مالیات را محاسبه، از حقوق کسر و به سازمان امور مالیاتی پرداخت کند.";

export function calculateIncomeTax1405(taxableIncome: bigint): { tax: bigint; breakdown: string[] } {
  const breakdown: string[] = [];
  const exemption = TAX_1405_BASICS.basicExemptionAnnualRials;
  if (taxableIncome <= exemption) {
    return { tax: 0n, breakdown: ["درآمد تا سقف معافیت سالانه ۱۴۰۵ (۴٬۸۰۰٬۰۰۰٬۰۰۰ ریال) معاف است؛ مالیاتی تعلق نمی‌گیرد."] };
  }

  let remaining = taxableIncome - exemption;
  let totalTax = 0n;
  breakdown.push(
    `درآمد مشمول: ${taxableIncome.toString()} ریال | معافیت ۱۴۰۵: ${exemption.toString()} ریال | مازاد مشمول نرخ پلکانی: ${remaining.toString()} ریال`
  );

  for (const bracket of INCOME_TAX_BRACKETS_1405) {
    if (remaining <= 0n) break;
    const width = bracket.max - bracket.min;
    const portion = remaining >= width ? width : remaining;
    const taxInBracket = (portion * BigInt(Math.round(bracket.rate * 10000))) / 10000n;
    totalTax += taxInBracket;
    breakdown.push(`نرخ ${bracket.label} بر مبلغ ${portion.toString()} ریال = ${taxInBracket.toString()} ریال`);
    remaining -= portion;
  }
  return { tax: totalTax, breakdown };
}

export function calculateMonthlyTax1405(grossMonthlyIncome: bigint): {
  monthlyTax: bigint;
  annualGross: bigint;
  annualTax: bigint;
  breakdown: string[];
} {
  const annualGross = grossMonthlyIncome * 12n;
  const { tax: annualTax, breakdown } = calculateIncomeTax1405(annualGross);
  return { monthlyTax: annualTax / 12n, annualGross, annualTax, breakdown };
}
