import Link from "next/link";

import { AvailabilityNotice, LandingPage } from "@/components/public/site-shell";

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
      <AvailabilityNotice title="قانون قابل محاسبه هنوز منتشر نشده است">
        تا زمان انتشار قانونِ بررسی‌شده، تاریخ مؤثر، واحد و شیوه گرد کردن، هیچ عددی محاسبه یا نمایش
        داده نمی‌شود. پس از ورود، فقط نتیجه ثبت‌شده از قانون منتشرشده قابل مشاهده خواهد بود.
      </AvailabilityNotice>
    </LandingPage>
  );
}
