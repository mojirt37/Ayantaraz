import { NextRequest, NextResponse } from "next/server";
import { TAX_ARTICLES } from "@/modules/knowledge/domain/content";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");
  const article = TAX_ARTICLES.find(a => slug ? a.slug === slug : id ? a.id === id : undefined);
  if (!article) return NextResponse.json({ error: "article not found" }, { status: 404 });
  return NextResponse.json(article);
}
