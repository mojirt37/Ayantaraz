import { describe, it, expect } from "vitest";
import {
  calculateTaxableIncome,
  calculateIncomeTax,
  calculateMonthlyTax,
  TAX_BASICS,
  INCOME_TAX_BRACKETS,
} from "../../src/modules/tax/application/rules/iranian-tax-rules";

describe("calculateTaxableIncome", () => {
  it("returns 0 when gross equals mandatory social security only", () => {
    const result = calculateTaxableIncome({
      grossAnnualIncome: 60_000_000n,
      mandatorySocialSecurity: 60_000_000n,
      housingRent: 0n,
      healthInsurance: 0n,
      lifeInsurance: 0n,
      education: 0n,
      medicalExpenses: 0n,
    });
    expect(result).toBe(0n);
  });

  it("caps housing rent at maximum 300M", () => {
    const result = calculateTaxableIncome({
      grossAnnualIncome: 1_000_000_000n,
      mandatorySocialSecurity: 75_000_000n,
      housingRent: 500_000_000n,
      healthInsurance: 0n,
      lifeInsurance: 0n,
      education: 0n,
      medicalExpenses: 0n,
    });
    expect(result).toBe(1_000_000_000n - 75_000_000n - 300_000_000n);
  });

  it("returns 0 for negative taxable income", () => {
    const result = calculateTaxableIncome({
      grossAnnualIncome: 100_000_000n,
      mandatorySocialSecurity: 50_000_000n,
      housingRent: 100_000_000n,
      healthInsurance: 50_000_000n,
      lifeInsurance: 50_000_000n,
      education: 50_000_000n,
      medicalExpenses: 100_000_000n,
    });
    expect(result).toBe(0n);
  });

  it("caps health insurance at maximum 100M", () => {
    const result = calculateTaxableIncome({
      grossAnnualIncome: 500_000_000n,
      mandatorySocialSecurity: 37_500_000n,
      housingRent: 0n,
      healthInsurance: 200_000_000n,
      lifeInsurance: 0n,
      education: 0n,
      medicalExpenses: 0n,
    });
    expect(result).toBe(500_000_000n - 37_500_000n - 100_000_000n);
  });
});

describe("calculateIncomeTax", () => {
  it("returns 0 tax when income is below exemption", () => {
    const result = calculateIncomeTax(500_000_000n);
    expect(result.tax).toBe(0n);
    expect(result.breakdown.length).toBe(1);
  });

  it("calculates 10% bracket correctly", () => {
    const result = calculateIncomeTax(700_000_000n);
    const taxableAfterExemption = 700_000_000n - TAX_BASICS.basicExemptionAnnualRials;
    const expectedTax = (taxableAfterExemption * 10n) / 100n;
    expect(result.tax).toBe(expectedTax);
  });

  it("calculates progressive tax across multiple brackets", () => {
    const result = calculateIncomeTax(2_000_000_000n);
    const taxableAfterExemption = 2_000_000_000n - TAX_BASICS.basicExemptionAnnualRials;
    expect(result.tax).toBeGreaterThan(0n);
    expect(result.breakdown.length).toBeGreaterThan(0);
    expect(result.breakdown.some((b) => b.includes("10%"))).toBe(true);
    expect(result.breakdown.some((b) => b.includes("15%"))).toBe(true);
    expect(result.breakdown.some((b) => b.includes("20%"))).toBe(true);
  });

  it("all brackets are defined", () => {
    expect(INCOME_TAX_BRACKETS.length).toBe(6);
    expect(INCOME_TAX_BRACKETS[0].rate).toBe(0.10);
    expect(INCOME_TAX_BRACKETS[5].rate).toBe(0.35);
  });

  it("is deterministic for same input", () => {
    const a = calculateIncomeTax(1_500_000_000n);
    const b = calculateIncomeTax(1_500_000_000n);
    expect(a.tax).toBe(b.tax);
    expect(a.breakdown).toEqual(b.breakdown);
  });
});

describe("calculateMonthlyTax", () => {
  it("calculates monthly tax from monthly income", () => {
    const result = calculateMonthlyTax(100_000_000n);
    expect(result.annualGross).toBe(1_200_000_000n);
    expect(result.taxableIncome).toBeGreaterThanOrEqual(0n);
    expect(result.monthlyTax).toBeGreaterThanOrEqual(0n);
    expect(result.monthlyTax).toBe(result.annualTax / 12n);
  });

  it("returns 0 monthly tax for low income", () => {
    const result = calculateMonthlyTax(10_000_000n);
    expect(result.monthlyTax).toBe(0n);
  });
});
