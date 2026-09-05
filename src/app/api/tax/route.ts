import { NextRequest, NextResponse } from "next/server";
import { TAX_DECISION_TREE } from "@/modules/knowledge/domain/decision-tree";
import { TAX_ARTICLES } from "@/modules/knowledge/domain/content";
import { etagNotModified, payloadEtag } from "@/shared/http/etag";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const body = {
    tree: TAX_DECISION_TREE,
    articles: TAX_ARTICLES.map((a) => ({ slug: a.slug, title: a.title, category: a.category })),
    knowledgeVersions: TAX_DECISION_TREE.length,
    articlesCount: TAX_ARTICLES.length,
  };
  const etag = payloadEtag(body);
  const notModified = etagNotModified(request, etag);
  if (notModified) return notModified;
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=300", ETag: etag, "X-Request-Id": requestId },
  });
}
