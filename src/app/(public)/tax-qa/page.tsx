import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";

export const metadata = { title: "پرسش و پاسخ مالیاتی" };

const topics = [
  ["مالیات درآمد", "نرخ‌ها، سرکلیه و نحوه محاسبه مالیات حقوق و کسب‌وکار"],
  ["مالیات بر ارزش افزوده", "نرخ، مشمولان و معافیت‌های قانونی"],
  ["مالیات مصدری", "کسور در منبع پرداخت و تسویه سالانه"],
  ["مالیات بر اموال", "مشمولان و مبنای محاسبه"],
  ["سود ارز و طلا", "نحوه برخورد مالیاتی با سود معاملات"],
  ["خدمات دیجیتال", "تکالیف فعالان اقتصاد دیجیتال"],
] as const;

export default function TaxQAPage() {
  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="tax-qa-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">پرسش و پاسخ مالیاتی</p>
            <h1 id="tax-qa-title">پاسخ مستند، یا هیچ پاسخ قطعی</h1>
            <p className="lead">
              هر پرسش از یک درخت تصمیم شفاف عبور می‌کند و فقط به دانش تأییدشده با منبع
              و تاریخ مؤثر می‌رسد. اگر برای موضوع شما منبع معتبری ثبت نشده باشد، سیستم
              حدس نمی‌زند؛ مسیر مشاوره را پیشنهاد می‌دهد.
            </p>
            <div className="action-row">
              <Link className="button" href="/dashboard/tax-qa">شروع پرسش (نیازمند ورود)</Link>
              <Link className="text-link" href="/tax-calculator">محاسبه‌گر مالیاتی</Link>
            </div>
          </div>
          <aside className="assurance-ledger reveal reveal-1" aria-label="پوشش موضوعی">
            <p className="panel-kicker">پوشش موضوعی</p>
            <dl>
              <dt>۶ حوزه</dt>
              <dd>درآمد، ارزش افزوده، مصدری، اموال، ارز و طلا، خدمات دیجیتال</dd>
              <dt>منبع هر پاسخ</dt>
              <dd>ماده قانونی و تاریخ مؤثر، زیر هر پاسخ نمایش داده می‌شود</dd>
            </dl>
          </aside>
        </section>
        <section className="section" aria-labelledby="topics-title">
          <p className="eyebrow">فهرست موضوعات</p>
          <h2 id="topics-title">از کدام حوزه شروع می‌کنید؟</h2>
          <ol className="topic-index">
            {topics.map(([title, desc]) => (
              <li key={title}>
                <Link href="/dashboard/tax-qa">
                  <span>
                    <strong>{title}</strong>
                    <br />
                    <small style={{ color: "var(--muted)" }}>{desc}</small>
                  </span>
                  <span className="go" aria-hidden="true">←</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
