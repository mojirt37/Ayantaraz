import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "ورود" };

export default function LoginPage() {
  return (
    <LandingPage
      eyebrow="ورود امن"
      title="ورود با شماره همراه"
      description="احراز هویت فقط با رمز یک‌بارمصرف انجام می‌شود. ارسال و تأیید رمز پس از اتصال ارائه‌دهنده پیامک و ذخیره‌ساز امن فعال خواهد شد."
    />
  );
}
