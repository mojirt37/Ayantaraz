import Link from "next/link";
import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "درباره آیان تراز" };

export default function AboutPage() {
  return (
    <LandingPage
      eyebrow="درباره آیان تراز"
      title="دقت مستند، به‌جای ادعای بزرگ"
      description="آیان تراز یک مرجع خدمات مالیاتی است که سه اصل را رعایت می‌کند: ورودی روشن، منبع نسخه‌دار، و نتیجه قابل پیگیری. آنچه تأیید نشده، منتشر نمی‌شود؛ آنچه منتشر شده، با منبع و تاریخ مؤثر قابل راستی‌آزمایی است."
    >
      <div className="action-row">
        <Link className="button" href="/tax-qa">شیوه پاسخ‌گویی</Link>
        <Link className="text-link" href="/consultation">درخواست مشاوره</Link>
      </div>
    </LandingPage>
  );
}
