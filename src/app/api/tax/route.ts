import { NextRequest, NextResponse } from "next/server";
import { TAX_DECISION_TREE } from "@/modules/knowledge/domain/decision-tree";
import { TAX_ARTICLES } from "@/modules/knowledge/domain/content";

const rootNode = TAX_DECISION_TREE[0]!;

export async function GET(): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  return NextResponse.json(
    {
      tree: TAX_DECISION_TREE,
      articles: TAX_ARTICLES.map((a) => ({ slug: a.slug, title: a.title, category: a.category })),
      knowledgeVersions: TAX_DECISION_TREE.length,
      articlesCount: TAX_ARTICLES.length,
    },
    { headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } }
  );
}
