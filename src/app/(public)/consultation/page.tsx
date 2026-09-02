import Link from "next/link";

import { LandingPage } from "@/components/public/site-shell";

export const metadata = { title: "مشاوره" };

export default function ConsultationLandingPage() {
  return (
    <LandingPage
      eyebrow="مشاوره"
      title="زمانی برای بررسی دقیق"
      description="رزرو نهایی فقط در سمت سرور و با کنترل هم‌زمانی انجام می‌شود؛ انتخاب زمان در مرورگر رزرو محسوب نمی‌شود."
    >
      <Link className="button" href="/login">
        ورود برای درخواست مشاوره
      </Link>
    </LandingPage>
  );
}
