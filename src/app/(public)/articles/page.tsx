import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";
import { getPublishedArticles } from "@/modules/content/application/get-published-content";

export const metadata = { title: "مقالات" };

export default async function ArticlesPage() {
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let unavailable = false;
  try {
    articles = await getPublishedArticles();
  } catch {
    unavailable = true;
  }
  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="articles-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">کتابخانه تخصصی</p>
            <h1 id="articles-title">مقالات منتشرشده</h1>
            <p className="lead">
              فقط مقالات تأیید و منتشرشده در این بخش قرار می‌گیرند؛ هر مقاله با تاریخ
              انتشار مشخص است.
            </p>
          </div>
        </section>
        <section className="section" aria-labelledby="articles-list-title">
          <p className="eyebrow">فهرست</p>
          <h2 id="articles-list-title">مقالات</h2>
          {unavailable && (
            <p className="error-text" role="alert">
              فهرست مقالات در دسترس نیست؛ لطفاً بعداً تلاش کنید.
            </p>
          )}
          {!unavailable && articles.length === 0 && (
            <p className="empty-state">هنوز مقاله تأییدشده‌ای منتشر نشده است.</p>
          )}
          <ol className="service-index">
            {articles.map((a) => (
              <li key={a.id}>
                <Link href={`/articles/${a.slug}`}>
                  <span>
                    <strong>{a.title}</strong>
                    <p>{a.summary}</p>
                  </span>
                  <span className="go" aria-hidden="true">← مطالعه</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
