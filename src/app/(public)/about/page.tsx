import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "درباره آیان تراز" };

export default function AboutPage() {
  return (
    <LandingPage
      eyebrow="درباره ما"
      title="شفافیت در مسیر تصمیم"
      description="آیان تراز بر محتوای قابل پیگیری، فرایندهای روشن و حفاظت از داده‌های کاربران تمرکز دارد."
    />
  );
}
