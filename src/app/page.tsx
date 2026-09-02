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
          <p className="eyebrow">قدرت از سادگی میاد</p>
          <h1 id="hero-title">تصمیم مالیاتیِ روشن، قابل پیگیری و مسئولانه</h1>
          <p className="lead">
            آیان تراز مسیر دسترسی به محتوای تخصصی، پاسخ‌های تأییدشده و خدمات مشاوره را شفاف نگه
            می‌دارد.
          </p>
          <Link className="button" href="/consultation">
            درخواست مشاوره
          </Link>
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
      </main>
    </SiteShell>
  );
}
