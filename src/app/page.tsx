import Link from "next/link";

import { SiteShell } from "@/components/public/site-shell";
import { HomeSlider } from "@/components/public/home-slider";
import { getActiveHomepageSlides } from "@/modules/content/application/get-homepage-slides";

const services = [
  {
    title: "پرسش و پاسخ مالیاتی",
    problem: "پاسخ‌های پراکنده و غیرقابل استناد، تصمیم را پرریسک می‌کند.",
    solution: "هر پاسخ فقط از دانش تأییدشده، با منبع و تاریخ مؤثر ارائه می‌شود؛ در نبود منبع، پاسخی داده نمی‌شود.",
    href: "/tax-qa",
  },
  {
    title: "محاسبه‌گر مالیاتی",
    problem: "محاسبه دستی، خطای گرد کردن و نسخه قانون را پنهان می‌کند.",
    solution: "ورودی نرمال‌شده، قانون نسخه‌دار و نتیجه تکرارپذیر؛ هر محاسبه با شناسنامه قانون ثبت می‌شود.",
    href: "/tax-calculator",
  },
  {
    title: "مشاوره تخصصی",
    problem: "برخی پرونده‌ها به بررسی انسانی نیاز دارند، نه فرمول.",
    solution: "رزرو زمان مشاوره با کنترل هم‌زمانی در سمت سرور؛ بدون رزرو نمایشی.",
    href: "/consultation",
  },
] as const;

export default async function HomePage() {
  let slides: Awaited<ReturnType<typeof getActiveHomepageSlides>> = [];
  try {
    slides = await getActiveHomepageSlides();
  } catch {
    slides = [];
  }
  return (
    <SiteShell>
      <main>
        {slides.length > 0 && <HomeSlider slides={slides} />}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">مشاوره مالیاتی دقیق</p>
            <h1 id="hero-title">پیش از هر تصمیم مالیاتی، منبع آن روشن باشد</h1>
            <p className="lead">
              آیان تراز سه مسیر مشخص ارائه می‌دهد: پاسخ مستند به پرسش‌های مالیاتی، محاسبه
              تکرارپذیر بر اساس قانون نسخه‌دار، و مشاوره انسانی برای مواردی که فرمول پاسخ
              نمی‌دهد.
            </p>
            <div className="action-row">
              <Link className="button" href="/consultation">
                درخواست مشاوره
              </Link>
              <Link className="text-link" href="/tax-qa">
                شیوه پاسخ‌گویی را ببینید
              </Link>
            </div>
          </div>
          <aside className="assurance-ledger reveal reveal-1" aria-label="تعهد روش کار">
            <p className="panel-kicker">روش کار</p>
            <dl>
              <dt>ورودی</dt>
              <dd>روشن و قابل بررسی ثبت می‌شود</dd>
              <dt>منبع</dt>
              <dd>فقط نسخه تأییدشده با تاریخ مؤثر</dd>
              <dt>نتیجه</dt>
              <dd>قابل پیگیری؛ بدون منبع، بدون پاسخ قطعی</dd>
            </dl>
          </aside>
        </section>
        <section className="section reveal reveal-1" aria-labelledby="process-title">
          <p className="eyebrow">مسیر شفاف</p>
          <h2 id="process-title">هر نتیجه، سه لایه کنترل را پشت سر می‌گذارد</h2>
          <ol className="process-list">
            <li>
              <span className="step" aria-hidden="true">۱</span>
              <div>
                <strong>ورودی دقیق</strong>
                <p>اطلاعات لازم روشن ثبت و نرمال‌سازی می‌شود؛ ورودی مبهم به نتیجه تبدیل نمی‌شود.</p>
              </div>
            </li>
            <li>
              <span className="step" aria-hidden="true">۲</span>
              <div>
                <strong>بررسی نسخه</strong>
                <p>فقط قانون و دانش منتشرشده با تاریخ مؤثر معتبر است؛ نسخه منقضی کنار گذاشته می‌شود.</p>
              </div>
            </li>
            <li>
              <span className="step" aria-hidden="true">۳</span>
              <div>
                <strong>نتیجه مسئولانه</strong>
                <p>در نبود منبع معتبر، پاسخ قطعی نمایش داده نمی‌شود و مسیر مشاوره پیشنهاد می‌گردد.</p>
              </div>
            </li>
          </ol>
        </section>
        <section className="section reveal reveal-2" aria-labelledby="services-title">
          <p className="eyebrow">خدمات</p>
          <h2 id="services-title">سه مسیر، هر یک برای یک مسئله مشخص</h2>
          <ol className="service-index">
            {services.map((s) => (
              <li key={s.href}>
                <Link href={s.href}>
                  <span>
                    <strong>{s.title}</strong>
                    <p>مسئله: {s.problem}</p>
                    <p>راه‌حل: {s.solution}</p>
                  </span>
                  <span className="go" aria-hidden="true">← مشاهده مسیر</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
        <section className="section reveal reveal-3" aria-labelledby="publication-title">
          <p className="eyebrow">انتشار کنترل‌شده</p>
          <h2 id="publication-title">کتابخانه منتشرشده</h2>
          <p className="lead">
            مقالات، ویدئوها و راهنماها تنها پس از تأیید و انتشار رسمی در این بخش قرار
            می‌گیرند. تا آن زمان، هیچ عنوان یا توصیه‌ای به‌صورت نمونه ساخته نمی‌شود.
          </p>
          <div className="action-row">
            <Link className="button-ghost" href="/articles">مقالات</Link>
            <Link className="button-ghost" href="/videos">ویدئوها</Link>
            <Link className="button-ghost" href="/mini-books">مینی‌بوک‌ها</Link>
            <Link className="button-ghost" href="/about">درباره ما</Link>
            <Link className="button-ghost" href="/consultation">مشاوره</Link>
            <Link className="button-ghost" href="/tax-qa">پرسش مالیاتی</Link>
            <Link className="button-ghost" href="/tax-calculator">محاسبه‌گر</Link>
            <Link className="button-ghost" href="/login">ورود / ثبت‌نام</Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
