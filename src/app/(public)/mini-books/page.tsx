import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";
import { getPublishedMiniBooks } from "@/modules/content/application/get-published-content";

export const metadata = { title: "مینی‌بوک‌ها" };

export default async function MiniBooksPage() {
  let books: Awaited<ReturnType<typeof getPublishedMiniBooks>> = [];
  let unavailable = false;
  try {
    books = await getPublishedMiniBooks();
  } catch {
    unavailable = true;
  }
  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="books-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">مطالعه آنلاین</p>
            <h1 id="books-title">مینی‌بوک‌های منتشرشده</h1>
            <p className="lead">
              فقط مینی‌بوک‌های تأیید و منتشرشده در این بخش قرار می‌گیرند؛ مطالعه به‌صورت
              آنلاین و بدون دکمه دانلود ارائه می‌شود.
            </p>
          </div>
        </section>
        <section className="section" aria-labelledby="books-list-title">
          <p className="eyebrow">فهرست</p>
          <h2 id="books-list-title">مینی‌بوک‌ها</h2>
          {unavailable && (
            <p className="error-text" role="alert">
              فهرست مینی‌بوک‌ها در دسترس نیست؛ لطفاً بعداً تلاش کنید.
            </p>
          )}
          {!unavailable && books.length === 0 && (
            <p className="empty-state">هنوز مینی‌بوک تأییدشده‌ای منتشر نشده است.</p>
          )}
          <ol className="service-index">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/mini-books/${b.slug}`}>
                  <span>
                    <strong>{b.title}</strong>
                    {b.description && <p>{b.description}</p>}
                  </span>
                  <span className="go" aria-hidden="true">← مطالعه آنلاین</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
