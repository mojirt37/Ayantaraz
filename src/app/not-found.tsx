import Link from "next/link";

import { LandingPage } from "@/components/public/site-shell";

export default function NotFound() {
  return (
    <LandingPage
      eyebrow="۴۰۴"
      title="این صفحه پیدا نشد"
      description="نشانی مورد نظر وجود ندارد یا دیگر در دسترس نیست."
    >
      <Link className="button" href="/">
        بازگشت به صفحه اصلی
      </Link>
    </LandingPage>
  );
}
