import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "ویدئوها" };

export default function VideosPage() {
  return (
    <LandingPage
      eyebrow="ویدئوها"
      title="آموزش تصویری"
      description="ویدئوهای منتشرشده پس از تأیید در این بخش نمایش داده می‌شوند."
    />
  );
}
