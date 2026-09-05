import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import type { TaxKnowledgeStore, ClarificationNode, ApprovedKnowledgeAnswer } from "@/modules/knowledge/application/decision-tree-contract";
import { TAX_DECISION_TREE } from "@/modules/knowledge/domain/decision-tree";
import { TAX_ARTICLES } from "@/modules/knowledge/domain/content";

function findTreeNode(nodeId: string) {
  return TAX_DECISION_TREE.find((n) => n.id === nodeId);
}

function toClarificationNode(nodeId: string): ClarificationNode | null {
  const node = findTreeNode(nodeId);
  if (!node || !("options" in node)) return null;
  return {
    id: node.id,
    prompt: node.prompt,
    options: node.options.map((o) => ({ id: o.id, label: o.label })),
  } as ClarificationNode;
}

function toApprovedAnswer(nodeId: string): ApprovedKnowledgeAnswer | null {
  const node = findTreeNode(nodeId);
  if (!node || !("answer" in node)) return null;
  const article = TAX_ARTICLES.find((a) => a.id === nodeId || a.slug === nodeId);
  if (!article) return null;
  return {
    knowledgeVersionId: article.id,
    sourceReference: article.sourceReference,
    effectiveFrom: article.effectiveFrom,
    effectiveTo: article.effectiveTo,
    content: article.content,
  };
}

export class PostgresKnowledgeStore implements TaxKnowledgeStore {
  async getInitialNode(): Promise<ClarificationNode | null> {
    const rows = await db.select().from(S.knowledgeVersions).where(eq(S.knowledgeVersions.status, "PUBLISHED")).limit(1);
    if (rows[0]) {
      const tree = rows[0].decisionTree as { rootNodeId?: string } | null;
      if (tree?.rootNodeId) return toClarificationNode(tree.rootNodeId);
    }
    return toClarificationNode(TAX_DECISION_TREE[0]!.id);
  }

  async select(input: { nodeId: string; optionId: string }): Promise<ClarificationNode | ApprovedKnowledgeAnswer | null> {
    const node = toClarificationNode(input.nodeId);
    if (node) return node;
    const answer = await db.select().from(S.knowledgeVersions).where(eq(S.knowledgeVersions.id, input.nodeId)).limit(1);
    if (answer[0]) {
      const row = answer[0];
      return {
        knowledgeVersionId: row.id,
        sourceReference: row.sourceReference,
        effectiveFrom: row.effectiveFrom.toISOString(),
        effectiveTo: row.effectiveTo?.toISOString() ?? null,
        content: (row.answerContent as { answer: string })?.answer ?? "",
      } as ApprovedKnowledgeAnswer;
    }
    const article = TAX_ARTICLES.find((a) => a.id === input.nodeId || a.slug === input.nodeId);
    if (article) {
      return {
        knowledgeVersionId: article.id,
        sourceReference: article.sourceReference,
        effectiveFrom: article.effectiveFrom,
        effectiveTo: article.effectiveTo,
        content: article.content,
      } as ApprovedKnowledgeAnswer;
    }
    return toClarificationNode(input.nodeId);
  }
}

export async function resolveTaxQuestion(
  store: TaxKnowledgeStore,
  input: { nodeId?: string; optionId?: string },
): Promise<
  | { kind: "CLARIFICATION"; node: ClarificationNode }
  | { kind: "ANSWER"; answer: ApprovedKnowledgeAnswer }
  | { kind: "NO_APPROVED_ANSWER" }
> {
  if (!input.nodeId) {
    const initial = await store.getInitialNode();
    return initial ? { kind: "CLARIFICATION", node: initial } : { kind: "NO_APPROVED_ANSWER" };
  }
  const selected = await store.select({ nodeId: input.nodeId, optionId: input.optionId ?? "" });
  if (!selected) {
    const answer = toApprovedAnswer(input.nodeId);
    return answer ? { kind: "ANSWER", answer } : { kind: "NO_APPROVED_ANSWER" };
  }
  if ("content" in selected) return { kind: "ANSWER", answer: selected };
  return { kind: "CLARIFICATION", node: selected };
}
