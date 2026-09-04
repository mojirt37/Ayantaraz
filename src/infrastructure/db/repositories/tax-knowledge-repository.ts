import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import type { TaxCalculationStore } from "@/modules/tax/application/calculation-contract";
import type { TaxKnowledgeStore } from "@/modules/knowledge/application/decision-tree-contract";

export class PostgresTaxStore implements TaxCalculationStore {
  async findPublishedRule(input: { taxType: string; effectiveDate: string }): Promise<
    { ruleVersionId: string; engineVersion: string; effectiveFrom: string; effectiveTo: string | null; sourceReference: string } | null
  > {
    const allRows = await db.select().from(S.taxRuleVersions).limit(1) as unknown as { id: string; taxRuleId: string; version: number; status: string; effectiveFrom: Date; effectiveTo: Date | null; sourceReference: string; engineVersion: string }[];
    const published = allRows.filter((r) => r.status === "PUBLISHED" && r.taxRuleId);
    const matching = published.filter((r) => {
      const eff = new Date(input.effectiveDate);
      return r.effectiveFrom <= eff && (!r.effectiveTo || r.effectiveTo >= eff);
    });
    return matching[0] ? {
      ruleVersionId: matching[0].id,
      engineVersion: matching[0].engineVersion,
      effectiveFrom: matching[0].effectiveFrom.toISOString(),
      effectiveTo: matching[0].effectiveTo?.toISOString() ?? null,
      sourceReference: matching[0].sourceReference,
    } : null;
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

export class PostgresKnowledgeStore implements TaxKnowledgeStore {
  async getInitialNode(): Promise<{ id: string; prompt: string; options: { id: string; label: string }[] } | null> {
    const rows = await db.select().from(S.knowledgeVersions).where(eq(S.knowledgeVersions.status, "PUBLISHED")).limit(1);
    const row = rows[0];
    if (!row) return null;
    const tree = row.decisionTree as { id?: string; prompt?: string; options?: { id: string; label: string }[] } | null;
    return tree && tree.id ? { id: tree.id, prompt: tree.prompt ?? "", options: tree.options ?? [] } : null;
  }

  async select(input: { nodeId: string; optionId: string }): Promise<
    { id: string; prompt: string; options: { id: string; label: string }[] } | null
  > {
    return null;
  }
}
