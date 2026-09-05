import { describe, expect, it } from "vitest";
import { TAX_DECISION_TREE } from "../../src/modules/knowledge/domain/decision-tree";
import { TAX_ARTICLES } from "../../src/modules/knowledge/domain/content";
import { resolveQaSelection } from "../../src/modules/knowledge/application/qa-traversal";

describe("resolveQaSelection", () => {
  it("advances from root through a valid option to the next node", () => {
    const result = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "root", "income-tax");
    expect(result.kind).toBe("NODE");
    if (result.kind === "NODE" && "prompt" in result.node) {
      expect(result.node.id).toBe("income-tax");
    }
  });

  it("rejects an option that does not belong to the current node", () => {
    // "answer-masdari" is a real node id, but not an option of root.
    const result = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "root", "answer-masdari");
    expect(result.kind).toBe("INVALID_OPTION");
  });

  it("rejects an unknown current node", () => {
    const result = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "no-such-node", "income-tax");
    expect(result.kind).toBe("INVALID_OPTION");
  });

  it("resolves an answer node chosen as an option", () => {
    // income-tax -> serkale -> answer-serkale path must terminate in an answer.
    const step1 = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "income-tax", "serkale");
    expect(step1.kind).toBe("NODE");
    const step2 = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "serkale", "answer-serkale");
    expect(step2.kind).toBe("ANSWER");
    if (step2.kind === "ANSWER") {
      expect(step2.answer.content.length).toBeGreaterThan(0);
      expect(step2.answer.sourceReference.length).toBeGreaterThan(0);
    }
  });

  it("returns NOT_FOUND for unknown lookup without option guard", () => {
    const result = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "no-such-node", null);
    expect(result.kind).toBe("NOT_FOUND");
  });

  it("walks the 1405 branch to a sourced answer", () => {
    const step1 = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "income-tax", "tax-1405");
    expect(step1.kind).toBe("NODE");
    const step2 = resolveQaSelection(TAX_DECISION_TREE, TAX_ARTICLES, "tax-1405", "answer-1405-brackets");
    expect(step2.kind).toBe("ANSWER");
    if (step2.kind === "ANSWER") {
      expect(step2.answer.sourceReference).toContain("۱۴۰۵");
    }
  });
});
