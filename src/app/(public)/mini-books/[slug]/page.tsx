import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { SiteShell } from "@/components/public/site-shell";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { resolveMediaUrl } from "@/modules/content/application/get-homepage-slides";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `مینی‌بوک ${slug}` };
}

export default async function MiniBookViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let book: { title: string; description: string | null; mediaUrl: string | null } | null = null;
  try {
    const rows = await db
      .select({ title: S.miniBooks.title, description: S.miniBooks.description, storageKey: S.media.storageKey, status: S.miniBooks.status })
      .from(S.miniBooks)
      .innerJoin(S.media, eq(S.miniBooks.mediaId, S.media.id))
      .where(eq(S.miniBooks.slug, slug))
      .limit(1);
    const row = rows[0];
    if (row && row.status === "PUBLISHED") {
      book = { title: row.title, description: row.description, mediaUrl: resolveMediaUrl(row.storageKey) };
    }
  } catch {
    book = null;
  }
  if (!book) notFound();
  return (
    <SiteShell>
      <main>
        <p className="eyebrow">مینی‌بوک</p>
        <h1>{book.title}</h1>
        {book.description && <p className="lead">{book.description}</p>}
        {book.mediaUrl ? (
          <>
            <div className="video-frame">
              <iframe src={book.mediaUrl} title={book.title} style={{ width: "100%", height: "70vh", border: 0 }} />
            </div>
            <p className="media-note">
              مطالعه آنلاین؛ دکمه دانلود ارائه نمی‌شود. توجه: مرورگر امکان استخراج محتوا را
              به‌طور کامل از بین نمی‌برد و چنین ادعایی نمی‌شود.
            </p>
          </>
        ) : (
          <p className="error-text">فایل این مینی‌بوک در دسترس نیست.</p>
        )}
      </main>
    </SiteShell>
  );
}
