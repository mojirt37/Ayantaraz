import { SiteShell } from "@/components/public/site-shell";
import { VideoPlayer } from "@/components/public/video-player";
import { getPublishedVideos } from "@/modules/content/application/get-published-content";

export const metadata = { title: "ویدئوها" };

export default async function VideosPage() {
  let videos: Awaited<ReturnType<typeof getPublishedVideos>> = [];
  let unavailable = false;
  try {
    videos = await getPublishedVideos();
  } catch {
    unavailable = true;
  }
  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="videos-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">آموزش تصویری</p>
            <h1 id="videos-title">ویدئوهای منتشرشده</h1>
            <p className="lead">
              فقط ویدئوهای تأیید و منتشرشده در این بخش قرار می‌گیرند؛ پخش آنلاین است و
              دکمه دانلود ارائه نمی‌شود.
            </p>
          </div>
        </section>
        <section className="section" aria-labelledby="videos-list-title">
          <p className="eyebrow">فهرست</p>
          <h2 id="videos-list-title">ویدئوها</h2>
          {unavailable && (
            <p className="error-text" role="alert">
              فهرست ویدئوها در دسترس نیست؛ لطفاً بعداً تلاش کنید.
            </p>
          )}
          {!unavailable && videos.length === 0 && (
            <p className="empty-state">هنوز ویدئوی تأییدشده‌ای منتشر نشده است.</p>
          )}
          <ol className="service-index">
            {videos.map((v) => (
              <li key={v.id}>
                <div style={{ padding: "1.15rem 0.25rem" }}>
                  <strong>{v.title}</strong>
                  {v.description && <p>{v.description}</p>}
                  {v.mediaUrl ? (
                    <>
                      <VideoPlayer src={v.mediaUrl} title={v.title} contentType={v.contentType} />
                      <p className="media-note">پخش آنلاین؛ دکمه دانلود ارائه نمی‌شود.</p>
                    </>
                  ) : (
                    <p className="error-text">فایل این ویدئو در دسترس نیست.</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
