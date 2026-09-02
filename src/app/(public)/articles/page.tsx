import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "مقالات" };

export default function ArticlesPage() {
  return (
    <LandingPage
      eyebrow="مقالات"
      title="محتوای ساختاریافته"
      description="مقالات منتشرشده پس از تأیید در این بخش نمایش داده می‌شوند."
    />
  );
}
