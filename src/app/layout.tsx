import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "آیان تراز — مشاوره مالیاتی دقیق", template: "%s | آیان تراز" },
  description: "پاسخ مستند به پرسش‌های مالیاتی، محاسبه تکرارپذیر بر اساس قانون نسخه‌دار، و مشاوره تخصصی."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
