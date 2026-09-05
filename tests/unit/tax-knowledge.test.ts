import { describe, it, expect } from "vitest";
import { TAX_DECISION_TREE } from "../../src/modules/knowledge/domain/decision-tree";
import { TAX_ARTICLES } from "../../src/modules/knowledge/domain/content";

function isDecisionNode(node: (typeof TAX_DECISION_TREE)[number]): node is Extract<(typeof TAX_DECISION_TREE)[number], { options: readonly { id: string; label: string }[] }> {
  return "options" in node;
}

describe("Tax Decision Tree", () => {
  it("has a root node", () => {
    const root = TAX_DECISION_TREE.find((n) => n.id === "root");
    expect(root).toBeDefined();
    expect(isDecisionNode(root!)).toBe(true);
    const decisionRoot = root as Extract<(typeof TAX_DECISION_TREE)[number], { options: readonly { id: string; label: string }[] }>;
    expect(decisionRoot.options.length).toBeGreaterThan(0);
  });

  it("root node has all top-level categories", () => {
    const root = TAX_DECISION_TREE.find((n) => n.id === "root");
    expect(root).toBeDefined();
    expect(isDecisionNode(root!)).toBe(true);
    const decisionRoot = root as Extract<(typeof TAX_DECISION_TREE)[number], { options: readonly { id: string; label: string }[] }>;
    const labels = decisionRoot.options.map((o) => o.label);
    expect(labels).toContain("مالیات درآمد (حقوق، کارآفرینی)");
    expect(labels).toContain("مالیات بر ارزش افزوده (VAT)");
    expect(labels).toContain("مالیات مصدری و پیش‌پرداختی");
    expect(labels).toContain("مالیات بر اموال و ملک");
    expect(labels).toContain("مالیات بر سود معاملات ارز و طلا");
    expect(labels).toContain("مالیات بر خدمات دیجیتال");
    expect(labels).toContain("محاسبه مالیاتی");
  });

  it("every branch node has at least one option", () => {
    for (const node of TAX_DECISION_TREE) {
      if (isDecisionNode(node) && node.options.length > 0) {
        for (const opt of node.options) {
          expect(opt.id).toBeTruthy();
          expect(opt.label).toBeTruthy();
        }
      }
    }
  });

  it("every article has required metadata fields", () => {
    for (const article of TAX_ARTICLES) {
      expect(article.id).toBeTruthy();
      expect(article.slug).toBeTruthy();
      expect(article.title).toBeTruthy();
      expect(article.content).toBeTruthy();
      expect(article.sourceReference).toBeTruthy();
      expect(article.status).toBe("PUBLISHED");
    }
  });

  it("article count matches expected", () => {
    expect(TAX_ARTICLES.length).toBe(10);
  });

  it("article categories are valid", () => {
    const categories = new Set(TAX_ARTICLES.map((a) => a.category));
    expect(categories.has("income-tax")).toBe(true);
    expect(categories.has("vat")).toBe(true);
    expect(categories.has("withholding")).toBe(true);
  });
});
