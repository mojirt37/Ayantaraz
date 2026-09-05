import { describe, expect, it } from "vitest";
import {
  INCOME_TAX_BRACKETS_1405,
  TAX_1405_BASICS,
  calculateIncomeTax1405,
  calculateMonthlyTax1405,
} from "../../src/modules/tax/application/rules/iranian-tax-rules-1405";
import { computeTaxResult } from "../../src/modules/tax/application/calculate-tax";

const RIALS_PER_TOMAN = 10n;
const toman = (n: bigint) => n * RIALS_PER_TOMAN;

describe("1405 basics (Budget Law 1405)", () => {
  it("exempts 480M Toman annually", () => {
    expect(TAX_1405_BASICS.basicExemptionAnnualRials).toBe(toman(480_000_000n));
    expect(TAX_1405_BASICS.basicExemptionMonthlyRials).toBe(toman(40_000_000n));
    expect(TAX_1405_BASICS.taxYear).toBe(1405);
  });

  it("defines five marginal bands from 10% to 30%", () => {
    expect(INCOME_TAX_BRACKETS_1405.map((b) => b.rate)).toEqual([0.1, 0.15, 0.2, 0.25, 0.3]);
  });
});

describe("calculateIncomeTax1405", () => {
  it("returns zero below the exemption", () => {
    expect(calculateIncomeTax1405(toman(400_000_000n)).tax).toBe(0n);
  });

  it("matches the published worked example: 55M Toman/month salary", () => {
    // 55M Toman/month = 660M Toman/year; excess over 480M = 180M in the 10% band.
    const { tax } = calculateIncomeTax1405(toman(660_000_000n));
    expect(tax).toBe(toman(18_000_000n));
  });

  it("applies rates marginally across bands (120M Toman/month)", () => {
    // Annual 1440M Toman; excess 960M = 480M@10% + 240M@15% + 240M@20%.
    const { tax } = calculateIncomeTax1405(toman(1_440_000_000n));
    expect(tax).toBe(toman(48_000_000n + 36_000_000n + 48_000_000n));
  });

  it("is deterministic", () => {
    const a = calculateIncomeTax1405(toman(1_000_000_000n));
    const b = calculateIncomeTax1405(toman(1_000_000_000n));
    expect(a.tax).toBe(b.tax);
    expect(a.breakdown).toEqual(b.breakdown);
  });
});

describe("calculateMonthlyTax1405", () => {
  it("derives monthly average from the annual figure", () => {
    const r = calculateMonthlyTax1405(toman(55_000_000n));
    expect(r.annualGross).toBe(toman(660_000_000n));
    expect(r.annualTax).toBe(toman(18_000_000n));
    expect(r.monthlyTax).toBe(toman(1_500_000n));
  });
});

describe("computeTaxResult taxYear routing", () => {
  const deductions = {
    mandatorySocialSecurity: 0n,
    housingRent: 0n,
    healthInsurance: 0n,
    lifeInsurance: 0n,
    education: 0n,
    medicalExpenses: 0n,
  };
  it("defaults to 1404 behavior without taxYear", () => {
    const r = computeTaxResult({ userId: "u", taxType: "income", grossIncome: 100n, effectiveDate: "2026-01-01", deductions });
    expect(r.taxYear).toBe(1404);
  });

  it("routes 1405 to the 1405 engine with its version and source", () => {
    const r = computeTaxResult({
      userId: "u",
      taxType: "income",
      taxYear: 1405,
      grossIncome: toman(660_000_000n),
      effectiveDate: "2026-01-01",
      deductions,
    });
    expect(r.taxYear).toBe(1405);
    expect(r.tax).toBe(toman(18_000_000n));
    expect(r.engineVersion).toBe(TAX_1405_BASICS.engineVersion);
    expect(r.sourceReference).toBe(TAX_1405_BASICS.sourceReference);
  });
});
