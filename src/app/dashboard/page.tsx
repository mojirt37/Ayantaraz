import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SiteShell } from "@/components/public/site-shell";
import { LogoutButton } from "@/components/public/logout-button";
import { requireSession } from "@/shared/auth/require-session";

export const metadata = { robots: { index: false, follow: false }, title: "میزکار" };

const workspaces = [
  { title: "پرسش مالیاتی", desc: "قدم‌به‌قدم تا پاسخ مستند با منبع و تاریخ مؤثر.", href: "/dashboard/tax-qa" },
  { title: "محاسبه‌گر مالیاتی", desc: "مالیات ۱۴۰۴ با شناسنامه قانون و نتیجه تکرارپذیر.", href: "/dashboard/tax-calculator" },
  { title: "رزرو مشاوره", desc: "انتخاب زمان آزاد با ثبت نهایی در سمت سرور.", href: "/dashboard/consultation" },
] as const;

export default async function DashboardPage() {
  const h = await headers();
  const actor = await requireSession({ headers: { get: (n: string) => h.get(n) } } as unknown as Request);
  if (!actor) redirect("/login");

  return (
    <SiteShell>
      <main>
        <p className="eyebrow">میزکار</p>
        <h1>مسیر شما در آیان تراز</h1>
        <p className="lead">هر سه فضای کاری با نشست امن شما محافظت می‌شوند.</p>
        <ol className="service-index">
          {workspaces.map((w) => (
            <li key={w.href}>
              <Link href={w.href}>
                <span>
                  <strong>{w.title}</strong>
                  <p>{w.desc}</p>
                </span>
                <span className="go" aria-hidden="true">← ورود</span>
              </Link>
            </li>
          ))}
        </ol>
        <div className="action-row">
          <LogoutButton />
          <LogoutButton scope="all" />
        </div>
      </main>
    </SiteShell>
  );
}
