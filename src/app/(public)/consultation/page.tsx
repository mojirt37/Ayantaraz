import Link from "next/link";

import { AvailabilityNotice, LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "مشاوره" };

export default function ConsultationLandingPage() {
  return (
    <LandingPage
      eyebrow="مشاوره تخصصی"
      title="زمانی برای بررسی دقیق پرونده شما"
      description="مواردی که پاسخ قطعی تأییدشده ندارند — یا پرونده شما پیچیدگی خاصی دارد — در جلسه مشاوره انسانی بررسی می‌شود. رزرو نهایی فقط در سمت سرور و با کنترل هم‌زمانی انجام می‌شود."
    >
      <div className="action-row">
        <Link className="button" href="/dashboard/consultation">
          مشاهده زمان‌ها و رزرو
        </Link>
        <Link className="text-link" href="/tax-qa">
          اول پرسش مالیاتی را امتحان کنید
        </Link>
      </div>
      <AvailabilityNotice title="ظرفیت واقعی، بدون نمایش نمایشی">
        فهرست زمان‌ها لحظه‌ای از سرور خوانده می‌شود. اگر زمانی در فهرست نیست، یعنی ظرفیت
        آزاد وجود ندارد — نه اینکه پنهان شده باشد. نمایش زمان در مرورگر، رزرو تأییدشده نیست.
      </AvailabilityNotice>
    </LandingPage>
  );
}
