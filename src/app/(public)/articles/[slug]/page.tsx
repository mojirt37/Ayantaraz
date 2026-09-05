import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { SiteShell } from "@/components/public/site-shell";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";

function renderBody(body: unknown): string[] {
  if (typeof body === "string") return [body];
  if (Array.isArray(body)) {
    return body
      .map((b) => {
        if (typeof b === "string") return b;
        if (b && typeof b === "object" && "text" in b && typeof (b as { text: unknown }).text === "string") {
          return (b as { text: string }).text;
        }
        return null;
      })
      .filter((t): t is string => t !== null);
  }
  if (body && typeof body === "object" && "paragraphs" in body && Array.isArray((body as { paragraphs: unknown }).paragraphs)) {
    return ((body as { paragraphs: unknown }).paragraphs as unknown[]).filter((p): p is string => typeof p === "string");
  }
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `مقاله ${slug}` };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: { title: string; summary: string; body: unknown; publishedAt: Date | null } | null = null;
  try {
    const rows = await db.select().from(S.articles).where(eq(S.articles.slug, slug)).limit(1);
    const row = rows[0];
    if (row && row.status === "PUBLISHED") {
      article = { title: row.title, summary: row.summary, body: row.body, publishedAt: row.publishedAt };
    }
  } catch {
    article = null;
  }
  if (!article) notFound();
  const paragraphs = renderBody(article.body);
  return (
    <SiteShell>
      <main>
        <article>
          <p className="eyebrow">مقاله</p>
          <h1>{article.title}</h1>
          <p className="lead">{article.summary}</p>
          {article.publishedAt && (
            <p className="media-note">منتشرشده در {article.publishedAt.toLocaleDateString("fa-IR")}</p>
          )}
          <div style={{ marginTop: "1.6rem", display: "grid", gap: "1rem", maxWidth: "var(--measure)" }}>
            {paragraphs.length === 0 && <p className="empty-state">متن کامل این مقاله در دسترس نیست.</p>}
            {paragraphs.map((p, i) => (
              <p key={i} style={{ margin: 0, lineHeight: 2 }}>
                {p}
              </p>
            ))}
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
