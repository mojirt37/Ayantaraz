import Link from "next/link";

import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "محاسبه‌گر مالیاتی" };

export default function TaxCalculatorLandingPage() {
  return (
    <LandingPage
      eyebrow="محاسبه‌گر مالیاتی"
      title="محاسبه تکرارپذیر، نه حدس"
      description="محاسبه فقط با ورودی نرمال‌شده، قانون منتشرشده، تاریخ مؤثر و نسخه موتور ثبت می‌شود."
    >
      <Link className="button" href="/login">
        ورود برای شروع
      </Link>
    </LandingPage>
  );
}
