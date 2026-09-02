export type DecisionOption = Readonly<{ id: string; label: string }>;
export type ClarificationNode = Readonly<{
  id: string;
  prompt: string;
  options: readonly DecisionOption[];
}>;
export type ApprovedKnowledgeAnswer = Readonly<{
  knowledgeVersionId: string;
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  content: string;
}>;

/**
 * A repository adapter returns only approved, published, explicit decision
 * nodes and answers. There is deliberately no generated-answer fallback.
 */
export interface TaxKnowledgeStore {
  getInitialNode(): Promise<ClarificationNode | null>;
  select(input: {
    nodeId: string;
    optionId: string;
  }): Promise<ClarificationNode | ApprovedKnowledgeAnswer | null>;
}
