import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  ["خانه", "/"],
  ["مقالات", "/articles"],
  ["ویدئوها", "/videos"],
  ["مینی‌بوک‌ها", "/mini-books"],
  ["درباره ما", "/about"]
] as const;

export function SiteShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="آیان تراز، صفحه اصلی">
          آیان تراز
        </Link>
        <nav aria-label="ناوبری اصلی">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="login-link" href="/login">
          ورود
        </Link>
      </header>
      {children}
      <footer className="site-footer">
        <p>آیان تراز — خدمات تخصصی حسابداری و مالیاتی</p>
      </footer>
    </div>
  );
}

export function LandingPage({
  eyebrow,
  title,
  description,
  children
}: Readonly<{ eyebrow: string; title: string; description: string; children?: ReactNode }>) {
  return (
    <SiteShell>
      <main className="landing">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
        {children}
      </main>
    </SiteShell>
  );
}
