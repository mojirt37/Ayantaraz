import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "مینی‌بوک‌ها" };

export default function MiniBooksPage() {
  return (
    <LandingPage
      eyebrow="مینی‌بوک‌ها"
      title="مطالعه آنلاین"
      description="مینی‌بوک‌های منتشرشده پس از تأیید در این بخش برای مشاهده آنلاین نمایش داده می‌شوند."
    />
  );
}
