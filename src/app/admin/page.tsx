import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { SiteShell } from "@/components/public/site-shell";
import { db } from "@/infrastructure/db/client";
import * as S from "@/infrastructure/db/schema";
import { requireSession } from "@/shared/auth/require-session";
import { requireAdmin } from "@/modules/users/domain/authorization";
import { advanceContent, advanceTaxRuleVersion, createTaxRuleDraft, toggleSlide } from "@/app/admin/actions";

export const metadata = { robots: { index: false, follow: false }, title: "پنل مدیریت" };

async function currentAdmin() {
  const h = await headers();
  const actor = await requireSession({ headers: { get: (n: string) => h.get(n) } } as unknown as Request);
  const admin = requireAdmin(actor);
  if (!admin.ok) redirect("/login");
  return admin.value;
}

function TransitionButton({ id, next, action, label }: { id: string; next: string; action: (f: FormData) => Promise<void>; label: string }) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <input type="hidden" name="versionId" value={id} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="button-ghost" style={{ minHeight: "2.2rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>
        {label}
      </button>
    </form>
  );
}

export default async function AdminPage() {
  const admin = await currentAdmin();

  const rules = await db.select().from(S.taxRules).orderBy(S.taxRules.createdAt);
  const versions = await db.select().from(S.taxRuleVersions).orderBy(desc(S.taxRuleVersions.createdAt)).limit(50);
  const articles = await db.select().from(S.articles).orderBy(desc(S.articles.createdAt)).limit(50);
  const videos = await db.select().from(S.videos).orderBy(desc(S.videos.createdAt)).limit(50);
  const books = await db.select().from(S.miniBooks).orderBy(desc(S.miniBooks.createdAt)).limit(50);
  const slides = await db.select().from(S.homepageSlides).orderBy(S.homepageSlides.displayOrder).limit(20);
  const audit = await db.select().from(S.auditLogs).orderBy(desc(S.auditLogs.createdAt)).limit(50);

  const ruleName = (id: string) => rules.find((r) => r.id === id)?.stableKey ?? id;

  return (
    <SiteShell>
      <main>
        <p className="eyebrow">پنل مدیریت</p>
        <h1>مدیریت سامانه</h1>
        <p className="lead">تمام تغییرات وضعیت با ثبت حسابرسی انجام می‌شود. شناسه مدیر: {admin.userId}</p>

        <section className="section" aria-labelledby="admin-tax">
          <p className="eyebrow">قوانین مالیاتی</p>
          <h2 id="admin-tax">نسخه‌های قانون (پیش‌نویس ← بررسی ← تأیید ← انتشار ← بایگانی)</h2>
          {versions.length === 0 && <p className="empty-state">نسخه‌ای ثبت نشده است.</p>}
          <ol className="service-index">
            {versions.map((v) => (
              <li key={v.id}>
                <div style={{ padding: "1rem 0.25rem", display: "grid", gap: "0.5rem" }}>
                  <strong>
                    {ruleName(v.taxRuleId)} — نسخه {v.version}
                  </strong>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                    وضعیت: {v.status} · مؤثر از {v.effectiveFrom.toLocaleDateString("fa-IR")} · منبع: {v.sourceReference}
                    {v.reviewedAt ? ` · بررسی‌شده ${v.reviewedAt.toLocaleDateString("fa-IR")}` : " · بدون بررسی"}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {v.status === "DRAFT" && <TransitionButton id={v.id} next="REVIEW" action={advanceTaxRuleVersion} label="ارسال به بررسی" />}
                    {v.status === "REVIEW" && <TransitionButton id={v.id} next="APPROVED" action={advanceTaxRuleVersion} label="تأیید (ثبت بررسی‌کننده)" />}
                    {v.status === "APPROVED" && <TransitionButton id={v.id} next="PUBLISHED" action={advanceTaxRuleVersion} label="انتشار" />}
                    {v.status === "PUBLISHED" && <TransitionButton id={v.id} next="ARCHIVED" action={advanceTaxRuleVersion} label="بایگانی" />}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <h3 style={{ marginTop: "1.5rem" }}>ایجاد پیش‌نویس جدید</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {rules.map((r) => (
              <form action={createTaxRuleDraft} key={r.id} style={{ display: "inline" }}>
                <input type="hidden" name="taxRuleId" value={r.id} />
                <button type="submit" className="button-ghost" style={{ minHeight: "2.2rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>
                  پیش‌نویس برای {r.stableKey}
                </button>
              </form>
            ))}
            {rules.length === 0 && <p className="empty-state">قانونی ثبت نشده است.</p>}
          </div>
        </section>

        <section className="section" aria-labelledby="admin-content">
          <p className="eyebrow">محتوا</p>
          <h2 id="admin-content">مقالات، ویدئوها و مینی‌بوک‌ها (پیش‌نویس ← پیش‌نمایش ← انتشار ← بایگانی)</h2>
          {(
            [
              ["article", articles],
              ["video", videos],
              ["minibook", books],
            ] as const
          ).map(([kind, items]) => (
            <div key={kind}>
              <h3 style={{ marginTop: "1.2rem" }}>{kind === "article" ? "مقالات" : kind === "video" ? "ویدئوها" : "مینی‌بوک‌ها"}</h3>
              {items.length === 0 && <p className="empty-state">موردی ثبت نشده است.</p>}
              <ol className="service-index">
                {items.map((c) => (
                  <li key={c.id}>
                    <div style={{ padding: "1rem 0.25rem", display: "grid", gap: "0.5rem" }}>
                      <strong>{c.title}</strong>
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                        {c.slug} · وضعیت: {c.status}
                      </p>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {c.status === "DRAFT" && (
                          <form action={advanceContent} style={{ display: "inline" }}>
                            <input type="hidden" name="kind" value={kind} />
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="next" value="PREVIEW" />
                            <button type="submit" className="button-ghost" style={{ minHeight: "2.2rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>پیش‌نمایش</button>
                          </form>
                        )}
                        {c.status === "PREVIEW" && (
                          <form action={advanceContent} style={{ display: "inline" }}>
                            <input type="hidden" name="kind" value={kind} />
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="next" value="PUBLISHED" />
                            <button type="submit" className="button-ghost" style={{ minHeight: "2.2rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>انتشار</button>
                          </form>
                        )}
                        {c.status === "PUBLISHED" && (
                          <form action={advanceContent} style={{ display: "inline" }}>
                            <input type="hidden" name="kind" value={kind} />
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="next" value="ARCHIVED" />
                            <button type="submit" className="button-ghost" style={{ minHeight: "2.2rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>بایگانی</button>
                          </form>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>

        <section className="section" aria-labelledby="admin-slides">
          <p className="eyebrow">صفحه اصلی</p>
          <h2 id="admin-slides">اسلایدهای نمایش ویژه</h2>
          {slides.length === 0 && <p className="empty-state">اسلایدی ثبت نشده است.</p>}
          <ol className="service-index">
            {slides.map((s) => (
              <li key={s.id}>
                <div style={{ padding: "1rem 0.25rem", display: "grid", gap: "0.5rem" }}>
                  <strong>
                    {s.displayOrder}. {s.title}
                  </strong>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>
                    {s.linkPath} · {s.active ? "فعال" : "غیرفعال"}
                  </p>
                  <form action={toggleSlide} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={s.active ? "false" : "true"} />
                    <button type="submit" className="button-ghost" style={{ minHeight: "2.2rem", padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>
                      {s.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="admin-audit">
          <p className="eyebrow">شفافیت</p>
          <h2 id="admin-audit">گزارش حسابرسی (۵۰ مورد اخیر)</h2>
          {audit.length === 0 && <p className="empty-state">رویدادی ثبت نشده است.</p>}
          <ol className="service-index">
            {audit.map((a) => (
              <li key={a.id}>
                <div style={{ padding: "0.8rem 0.25rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{a.action}</strong>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.82rem" }}>
                    {a.entityType} · {a.createdAt.toLocaleString("fa-IR")} · مدیر: {a.actorId ?? "—"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </SiteShell>
  );
}
