import Link from "next/link";

import { AvailabilityNotice, LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "محاسبه‌گر مالیاتی" };

export default function TaxCalculatorLandingPage() {
  return (
    <LandingPage
      eyebrow="محاسبه‌گر مالیاتی"
      title="محاسبه تکرارپذیر، نه تخمین شفاهی"
      description="ورودی شما نرمال‌سازی می‌شود، قانون منتشرشده با تاریخ مؤثر اعمال می‌گردد و نتیجه همراه شناسنامه قانون ثبت می‌شود. خروجی، مشاوره مالیاتی نیست و جایگزین تأیید نهایی سازمان امور مالیاتی نمی‌شود."
    >
      <Link className="button" href="/login">
        ورود برای شروع محاسبه
      </Link>
      <AvailabilityNotice title="شرط اجرای محاسبه">
        محاسبه فقط زمانی اجرا می‌شود که قانون بررسی‌شده و منتشرشده با تاریخ مؤثر در
        سامانه ثبت شده باشد. در نبود قانون منتشرشده، عددی نمایش داده نمی‌شود و نتیجه‌ای
        ثبت نمی‌گردد.
      </AvailabilityNotice>
    </LandingPage>
  );
}
