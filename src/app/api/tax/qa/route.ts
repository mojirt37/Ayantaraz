import { NextRequest, NextResponse } from "next/server";
import { TAX_DECISION_TREE } from "@/modules/knowledge/domain/decision-tree";
import { TAX_ARTICLES } from "@/modules/knowledge/domain/content";

const rootNode = TAX_DECISION_TREE[0]!;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");
  const optionId = searchParams.get("optionId");
  const articleSlug = searchParams.get("slug");
  const articleId = searchParams.get("id");

  if (articleSlug || articleId) {
    const article = TAX_ARTICLES.find((a) => articleSlug ? a.slug === articleSlug : a.id === articleId);
    if (!article) return NextResponse.json({ error: "article not found" }, { status: 404 });
    return NextResponse.json(article);
  }

  if (!nodeId) return NextResponse.json(rootNode);
  if (nodeId === "root") return NextResponse.json(rootNode);
  const node = TAX_DECISION_TREE.find((n) => n.id === nodeId);
  if (node) return NextResponse.json(node);
  const answer = TAX_ARTICLES.find((a) => a.id === nodeId || a.slug === nodeId);
  if (answer) {
    return NextResponse.json({
      kind: "ANSWER",
      answer: {
        knowledgeVersionId: answer.id,
        sourceReference: answer.sourceReference,
        effectiveFrom: answer.effectiveFrom,
        effectiveTo: answer.effectiveTo,
        content: answer.content,
      },
    });
  }
  return NextResponse.json({ kind: "NO_APPROVED_ANSWER" }, { status: 404 });
}
