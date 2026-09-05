import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";

export default function TaxQAPage() {
  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="tax-qa-title">
          <div className="hero-copy">
            <p className="eyebrow">پرسش و پاسخ مالیاتی</p>
            <h1 id="tax-qa-title">پاسخ‌های دقیق و تأییدشده از منابع قانونی</h1>
            <p className="lead">
              سؤال مالیاتی خود را مطرح کنید و از دیکشنری قانونی تأییدشده، پاسخ‌های قطعی و قابل پیگیری دریافت کنید.
              هیچ پاسخی حدسی یا تولیدشده نیست.
            </p>
<div className="action-row">
               <Link className="button" href="/dashboard/tax-qa">شروع پرسش مالیاتی</Link>
               <Link className="text-link" href="/tax-calculator">ماشین‌حساب مالیاتی</Link>
             </div>
          </div>
          <aside className="hero-assurance" aria-label="تضمین کیفیت">
            <span className="assurance-number">۱۰</span>
            <p>موضوع مالیاتی قابل پیگیری</p>
            <small>قانون مالیات درآمد · مالیات بر ارزش افزوده · مالیات مصدری · اموال خالص · خدمات دیجیتال</small>
          </aside>
        </section>
        <section aria-labelledby="topics-title">
          <h2 id="topics-title">موضوعات مالیاتی</h2>
          <div className="topic-grid">
            <a href="/dashboard/tax-qa" className="topic-card">مالیات درآمد</a>
            <a href="/dashboard/tax-qa" className="topic-card">مالیات بر ارزش افزوده</a>
            <a href="/dashboard/tax-qa" className="topic-card">مالیات مصدری</a>
            <a href="/dashboard/tax-qa" className="topic-card">مالیات بر اموال</a>
            <a href="/dashboard/tax-qa" className="topic-card">سود ارز و طلا</a>
            <a href="/dashboard/tax-qa" className="topic-card">خدمات دیجیتال</a>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
