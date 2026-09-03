import { AvailabilityNotice, LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "ورود" };

export default function LoginPage() {
  return (
    <LandingPage
      eyebrow="ورود امن"
      title="ورود با شماره همراه"
      description="احراز هویت فقط با رمز یک‌بارمصرف انجام می‌شود. ارسال و تأیید رمز پس از اتصال ارائه‌دهنده پیامک و ذخیره‌ساز امن فعال خواهد شد."
    >
      <AvailabilityNotice title="ورود هنوز فعال نشده است">
        برای محافظت از حساب‌ها، تا اتصال ارائه‌دهنده پیامکِ تأییدشده و ذخیره‌سازی امن، فرم یا کد
        یک‌بارمصرف نمایشی ارائه نمی‌شود.
      </AvailabilityNotice>
    </LandingPage>
  );
}
