import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeTaxResult } from "@/modules/tax/application/calculate-tax";
import { PostgresTaxStore } from "@/infrastructure/db/repositories/tax-knowledge-repository";
import { requireSession } from "@/shared/auth/require-session";

const rialsString = z.string().regex(/^[0-9\s,٬۰-۹]+$/, "must be a non-negative integer amount").transform((s) => s.replace(/[\s,٬]/g, ""));
import { parseRialsAmount as parseRials } from "@/modules/tax/domain/parse-rials";

const bodySchema = z.object({
  grossMonthlyIncome: rialsString.optional(),
  grossAnnualIncome: rialsString.optional(),
  deductions: z.object({
    mandatorySocialSecurity: rialsString.optional(),
    housingRent: rialsString.optional(),
    healthInsurance: rialsString.optional(),
    lifeInsurance: rialsString.optional(),
    education: rialsString.optional(),
    medicalExpenses: rialsString.optional(),
  }).optional(),
}).refine((b) => b.grossMonthlyIncome !== undefined || b.grossAnnualIncome !== undefined, { message: "gross income required" });

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await requireSession(request);
  if (!actor) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "validation error", issues: parsed.error.issues }, { status: 422 });
  const body = parsed.data;

  const grossRaw = body.grossMonthlyIncome ?? body.grossAnnualIncome ?? "";
  const gross = parseRials(grossRaw);
  if (gross === null) return NextResponse.json({ error: "invalid gross income" }, { status: 422 });
  const d = body.deductions ?? {};
  const amounts: Record<string, bigint> = {};
  for (const [key, value] of Object.entries(d)) {
    if (value === undefined) continue;
    const parsedAmount = parseRials(value);
    if (parsedAmount === null) return NextResponse.json({ error: `invalid deduction: ${key}` }, { status: 422 });
    amounts[key] = parsedAmount;
  }

  const result = computeTaxResult({
    userId: actor.userId,
    taxType: "income",
    grossIncome: body.grossMonthlyIncome ? gross * 12n : gross,
    effectiveDate: new Date().toISOString(),
    deductions: {
      mandatorySocialSecurity: amounts["mandatorySocialSecurity"] ?? 0n,
      housingRent: amounts["housingRent"] ?? 300_000_000n,
      healthInsurance: amounts["healthInsurance"] ?? 100_000_000n,
      lifeInsurance: amounts["lifeInsurance"] ?? 50_000_000n,
      education: amounts["education"] ?? 0n,
      medicalExpenses: amounts["medicalExpenses"] ?? 0n,
    },
  });

  const payload = {
    grossIncome: result.grossIncome.toString(),
    taxableIncome: result.taxableIncome.toString(),
    tax: result.tax.toString(),
    monthlyTax: result.monthlyTax.toString(),
    breakdown: result.breakdown,
    disclaimer: result.disclaimer,
  };
  try {
    await persistCalculation(actor.userId, result);
  } catch {
    return NextResponse.json({ ...payload, persisted: false, warning: "calculation completed but history was not persisted" }, { status: 200 });
  }
  return NextResponse.json({ ...payload, persisted: true }, { status: 200 });
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
  if (!rule) throw new Error("no published tax rule available");
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
