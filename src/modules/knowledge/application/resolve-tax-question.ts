import type {
  ApprovedKnowledgeAnswer,
  ClarificationNode,
  TaxKnowledgeStore
} from "./decision-tree-contract";

export type TaxQuestionResolution =
  | Readonly<{ kind: "CLARIFICATION"; node: ClarificationNode }>
  | Readonly<{ kind: "ANSWER"; answer: ApprovedKnowledgeAnswer }>
  | Readonly<{ kind: "NO_APPROVED_ANSWER" }>;

export async function startTaxQuestion(store: TaxKnowledgeStore): Promise<TaxQuestionResolution> {
  const node = await store.getInitialNode();
  return node === null ? { kind: "NO_APPROVED_ANSWER" } : { kind: "CLARIFICATION", node };
}

export async function answerTaxClarification(
  store: TaxKnowledgeStore,
  input: { nodeId: string; optionId: string }
): Promise<TaxQuestionResolution> {
  const selected = await store.select(input);
  if (selected === null) return { kind: "NO_APPROVED_ANSWER" };
  return "content" in selected
    ? { kind: "ANSWER", answer: selected }
    : { kind: "CLARIFICATION", node: selected };
}
