import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  ["خانه", "/"],
  ["مقالات", "/articles"],
  ["ویدئوها", "/videos"],
  ["مینی‌بوک‌ها", "/mini-books"],
  ["درباره ما", "/about"]
] as const;

const productNavigation = [
  ["پرسش مالیاتی", "/tax-qa"],
  ["محاسبه‌گر", "/tax-calculator"],
  ["مشاوره", "/consultation"],
  ["مدیریت", "/admin"]
] as const;

export function SiteShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">پرش به محتوای اصلی</a>
      <header className="site-header">
        <div className="header-identity">
          <Link className="brand" href="/" aria-label="آیان تراز، صفحه اصلی">
            <span className="brand-mark" aria-hidden="true">
              آ
            </span>
            <span>آیان تراز</span>
          </Link>
          <span className="brand-caption">حسابداری و مالیات</span>
        </div>
        <nav className="primary-nav" aria-label="ناوبری اصلی">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="login-link" href="/login">
          ورود امن
        </Link>
      </header>
      <div id="main">{children}</div>
      <footer className="site-footer">
        <p>آیان تراز — تصمیم مالیاتیِ روشن، مستند و قابل پیگیری؛ بدون حدس و بدون ادعا.</p>
        <nav aria-label="مسیرهای خدمات">
          {productNavigation.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}

export function LandingPage({
  eyebrow,
  title,
  description,
  children
}: Readonly<{ eyebrow: string; title: string; description: string; children?: ReactNode }>) {
  return (
    <SiteShell>
      <main className="landing page-frame">
        <div className="landing-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{description}</p>
          {children}
        </div>
        <aside className="trust-panel" aria-label="اصول خدمات آیان تراز">
          <p className="panel-kicker">روش کار</p>
          <ol>
            <li>اطلاعات روشن و قابل بررسی</li>
            <li>قانون و دانش نسخه‌دار</li>
            <li>تأیید نهایی در سمت سرور</li>
          </ol>
        </aside>
      </main>
    </SiteShell>
  );
}

export function AvailabilityNotice({
  title = "هنوز محتوای تأییدشده‌ای منتشر نشده است",
  children
}: Readonly<{ title?: string; children: ReactNode }>) {
  return (
    <section className="availability-notice" aria-labelledby="availability-title">
      <p className="status-label">وضعیت انتشار</p>
      <h2 id="availability-title">{title}</h2>
      <p>{children}</p>
    </section>
  );
}
