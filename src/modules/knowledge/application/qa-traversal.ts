import type { TAX_DECISION_TREE as TreeType } from "@/modules/knowledge/domain/decision-tree";
import type { TAX_ARTICLES as ArticlesType } from "@/modules/knowledge/domain/content";

type Tree = typeof TreeType;
type Articles = typeof ArticlesType;

export type QaSelection =
  | { kind: "NODE"; node: Tree[number] }
  | { kind: "ANSWER"; answer: { knowledgeVersionId: string; sourceReference: string; effectiveFrom: string; effectiveTo: string | null; content: string } }
  | { kind: "INVALID_OPTION" }
  | { kind: "NOT_FOUND" };

function findNode(tree: Tree, id: string) {
  return tree.find((n) => n.id === id);
}

/**
 * Resolves one Q&A step: the chosen optionId must be an option of the current
 * nodeId, and then resolves to the next node or approved answer. Guards
 * against jumping to arbitrary nodes by forging option ids.
 */
export function resolveQaSelection(tree: Tree, articles: Articles, nodeId: string, optionId: string | null): QaSelection {
  const lookupId = optionId ?? nodeId;
  if (optionId !== null) {
    const current = findNode(tree, nodeId);
    if (!current || !("options" in current) || !current.options.some((o) => o.id === optionId)) {
      return { kind: "INVALID_OPTION" };
    }
  }
  const node = findNode(tree, lookupId);
  if (node) {
    // Answer nodes carry approved content directly; surface them as answers
    // so clients never receive an unrenderable node shape.
    if ("answer" in node) {
      return {
        kind: "ANSWER",
        answer: {
          knowledgeVersionId: node.id,
          sourceReference: node.sourceReference,
          effectiveFrom: node.effectiveFrom,
          effectiveTo: null,
          content: node.answer,
        },
      };
    }
    return { kind: "NODE", node };
  }
  const article = articles.find((a) => a.id === lookupId || a.slug === lookupId);
  if (article) {
    return {
      kind: "ANSWER",
      answer: {
        knowledgeVersionId: article.id,
        sourceReference: article.sourceReference,
        effectiveFrom: article.effectiveFrom,
        effectiveTo: article.effectiveTo,
        content: article.content,
      },
    };
  }
  return { kind: "NOT_FOUND" };
}
