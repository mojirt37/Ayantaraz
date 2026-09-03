import Link from "next/link";

import { SiteShell } from "@/components/public/site-shell";

const services = [
  ["پرسش و پاسخ مالیاتی", "پاسخ‌ها فقط بر پایه دانش و منابع تأییدشده ارائه می‌شوند.", "/tax-qa"],
  [
    "محاسبه‌گر مالیاتی",
    "نتیجه‌گیری فقط با قانون نسخه‌دار و داده‌های معتبر انجام می‌شود.",
    "/tax-calculator"
  ],
  ["مشاوره تخصصی", "برای بررسی مواردی که پاسخ قطعی تأییدشده ندارند.", "/consultation"]
] as const;

export default function HomePage() {
  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">قدرت از سادگی میاد</p>
            <h1 id="hero-title">تصمیم مالیاتیِ روشن، قابل پیگیری و مسئولانه</h1>
            <p className="lead">
              آیان تراز مسیر دسترسی به محتوای تخصصی، پاسخ‌های تأییدشده و خدمات مشاوره را شفاف نگه
              می‌دارد.
            </p>
            <div className="action-row">
              <Link className="button" href="/consultation">
                درخواست مشاوره
              </Link>
              <Link className="text-link" href="/tax-qa">
                نحوه پاسخ‌گویی را ببینید
              </Link>
            </div>
          </div>
          <aside className="hero-assurance" aria-label="تعهد خدمت">
            <span className="assurance-number">۳</span>
            <p>لایه کنترل برای هر تصمیم</p>
            <small>ورودی روشن · منبع تأییدشده · نتیجه قابل پیگیری</small>
          </aside>
        </section>
        <section className="process-section" aria-labelledby="process-title">
          <div>
            <p className="eyebrow">مسیر شفاف</p>
            <h2 id="process-title">پیش از هر نتیجه، منبع و تاریخ بررسی می‌شود.</h2>
          </div>
          <ol className="process-list">
            <li>
              <span>۱</span>
              <div>
                <strong>ورودی دقیق</strong>
                <p>اطلاعات لازم را روشن و قابل بررسی ثبت کنید.</p>
              </div>
            </li>
            <li>
              <span>۲</span>
              <div>
                <strong>بررسی نسخه</strong>
                <p>فقط مسیرهای تأییدشده و تاریخ مؤثر قابل استفاده‌اند.</p>
              </div>
            </li>
            <li>
              <span>۳</span>
              <div>
                <strong>نتیجه مسئولانه</strong>
                <p>در نبود منبع معتبر، پاسخ قطعی نمایش داده نمی‌شود.</p>
              </div>
            </li>
          </ol>
        </section>
        <section aria-labelledby="services-title">
          <h2 id="services-title">خدمات</h2>
          <div className="service-grid">
            {services.map(([title, description, href]) => (
              <article className="service-card" key={href}>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={href}>مشاهده مسیر</Link>
              </article>
            ))}
          </div>
        </section>
        <section className="publication-section" aria-labelledby="publication-title">
          <p className="eyebrow">انتشار کنترل‌شده</p>
          <h2 id="publication-title">محتوا، ویدئو و راهنمای منتشرشده</h2>
          <p className="lead">
            این بخش پس از تأیید و انتشار رسمی، منابع در دسترس را نمایش می‌دهد. تا آن زمان، هیچ عنوان
            یا توصیه‌ای به‌صورت نمونه ساخته نمی‌شود.
          </p>
          <div className="publication-links">
            <Link href="/articles">مقالات</Link>
            <Link href="/videos">ویدئوها</Link>
            <Link href="/mini-books">مینی‌بوک‌ها</Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
