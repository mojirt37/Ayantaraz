"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteShell } from "@/components/public/site-shell";
import { LogoutButton } from "@/components/public/logout-button";

interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

function formatSlot(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })} · ساعت ${d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function ConsultationBookingPage() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setRefreshToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      // All state writes happen after awaits: no synchronous set-state cascade.
      try {
        const [meRes, slotsRes] = await Promise.all([fetch("/api/auth/session"), fetch("/api/appointments/slots")]);
        if (cancelled) return;
        if (meRes.status === 401 || slotsRes.status === 401) {
          setError("نشست شما معتبر نیست؛ دوباره وارد شوید.");
          setLoading(false);
          return;
        }
        if (!meRes.ok || !slotsRes.ok) throw new Error("request failed");
        const me = (await meRes.json()) as { userId: string };
        const data = (await slotsRes.json()) as { slots: Slot[] };
        if (cancelled) return;
        setUserId(me.userId);
        setSlots(data.slots);
        setError(null);
      } catch {
        if (!cancelled) setError("دریافت زمان‌ها ناموفق بود؛ دوباره تلاش کنید.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const reserve = useCallback(async () => {
    if (!selected || !userId) return;
    setBooking(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve", userId, slotId: selected, idempotencyKey: crypto.randomUUID() }),
      });
      const data = (await res.json()) as { data?: unknown; error?: string };
      if (!res.ok) {
        if (res.status === 409) setError("این زمان هم‌اکنون توسط کاربر دیگری رزرو شد؛ زمان دیگری انتخاب کنید.");
        else if (res.status === 401) setError("نشست شما معتبر نیست؛ دوباره وارد شوید.");
        else setError(data.error ?? "رزرو ناموفق بود؛ دوباره تلاش کنید.");
        reload();
        return;
      }
      setNotice("رزرو شما با موفقیت ثبت شد.");
      setSelected(null);
      reload();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setBooking(false);
    }
  }, [selected, userId, reload]);

  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="booking-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">رزرو مشاوره</p>
            <h1 id="booking-title">زمان مشاوره خود را انتخاب کنید</h1>
            <p className="lead">
              فهرست زیر از سرور خوانده می‌شود و ظرفیت لحظه‌ای است. رزرو نهایی فقط با
              کنترل هم‌زمانی در سمت سرور انجام می‌شود؛ اگر زمان انتخابی هم‌زمان پر شده
              باشد، پیام تعارض دریافت می‌کنید.
            </p>
            <Link className="text-link" href="/dashboard/tax-qa">پرسش و پاسخ مالیاتی</Link>
            <LogoutButton />
          </div>
        </section>

        <section className="section" aria-labelledby="slots-title" aria-live="polite">
          <p className="eyebrow">ظرفیت</p>
          <h2 id="slots-title">زمان‌های پیش رو</h2>
          {loading && <p className="loading-text" role="status">در حال دریافت زمان‌ها…</p>}
          {error && (
            <p className="error-text" role="alert">
              {error}{" "}
              <Link href="/login">ورود</Link>
            </p>
          )}
          {notice && <p role="status" style={{ color: "var(--ok)" }}>{notice}</p>}
          {slots && slots.length === 0 && !loading && (
            <p className="empty-state">در حال حاضر زمان قابل رزروی منتشر نشده است.</p>
          )}
          {slots && slots.length > 0 && (
            <ol className="service-index">
              {slots.map((s) => (
                <li key={s.id}>
                  <div style={{ padding: "1rem 0.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <span>
                      <strong>{formatSlot(s.startsAt)}</strong>
                      <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.86rem" }}>
                        {s.available ? "ظرفیت آزاد" : "رزرو شده"}
                      </p>
                    </span>
                    <span style={{ marginInlineStart: "auto", display: "flex", gap: "0.6rem" }}>
                      <button
                        type="button"
                        className={selected === s.id ? "button" : "button-ghost"}
                        disabled={!s.available || booking}
                        onClick={() => setSelected(s.id)}
                        aria-pressed={selected === s.id}
                      >
                        {selected === s.id ? "انتخاب شد" : "انتخاب"}
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {selected && (
            <div className="action-row">
              <button className="button" onClick={reserve} disabled={booking}>
                {booking ? "در حال ثبت رزرو…" : "تأیید نهایی رزرو"}
              </button>
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
