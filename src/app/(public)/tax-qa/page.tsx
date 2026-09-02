import Link from "next/link";

import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "پرسش و پاسخ مالیاتی" };

export default function TaxQaLandingPage() {
  return (
    <LandingPage
      eyebrow="پرسش و پاسخ مالیاتی"
      title="پاسخ قطعی فقط از مسیر تأییدشده"
      description="برای دریافت پاسخ، پرسش شما با مراحل شفاف‌سازی و دانش نسخه‌دارِ تأییدشده بررسی می‌شود. در نبود مسیر معتبر، پاسخ ساخته نمی‌شود."
    >
      <Link className="button" href="/login">
        ورود برای شروع
      </Link>
    </LandingPage>
  );
}
