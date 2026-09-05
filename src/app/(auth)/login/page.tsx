"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteShell } from "@/components/public/site-shell";

const RESEND_SECONDS = 60;

function normalizePhone(input: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const latin = input.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d))).replace(/[\s-]/g, "");
  if (/^09\d{9}$/.test(latin)) return `+98${latin.slice(1)}`;
  if (/^\+[1-9][0-9]{7,14}$/.test(latin)) return latin;
  return "";
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timer.current = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [cooldown]);

  const requestCode = useCallback(
    async (isResend: boolean) => {
      const normalized = normalizePhone(phone);
      if (!normalized) {
        setError("شماره همراه معتبر نیست؛ مثال: 09123456789");
        return;
      }
      if (isResend && cooldown > 0) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request-otp", phone: normalized }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 429) setError("درخواست‌های پشت سر هم محدود شده‌اند؛ لطفاً کمی بعد تلاش کنید.");
          else if (res.status === 503) setError("سرویس پیامک در دسترس نیست؛ لطفاً بعداً تلاش کنید.");
          else setError("ارسال کد ناموفق بود؛ شماره را بازبینی کنید.");
          return;
        }
        setChallengeId(data.challengeId as string);
        setCooldown(RESEND_SECONDS);
      } catch {
        setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
      } finally {
        setLoading(false);
      }
    },
    [phone, cooldown]
  );

  const verifyCode = useCallback(async () => {
    const normalized = normalizePhone(phone);
    if (!challengeId || !/^\d{6}$/.test(code)) {
      setError("کد تأیید باید ۶ رقم باشد.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-otp", challengeId, phone: normalized, code }),
      });
      if (!res.ok) {
        if (res.status === 429) setError("تلاش‌های ناموفق زیاد شده؛ لطفاً بعداً تلاش کنید.");
        else setError("کد تأیید نامعتبر یا منقضی است.");
        return;
      }
      router.push("/dashboard/tax-qa");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }, [phone, challengeId, code, router]);

  return (
    <SiteShell>
      <main className="page-frame">
        <div className="reveal">
          <p className="eyebrow">ورود امن</p>
          <h1>ورود با رمز یک‌بارمصرف</h1>
          <p className="lead">
            شماره همراه خود را وارد کنید تا کد ۶ رقمی پیامک شود. کد ۵ دقیقه اعتبار دارد
            و هر کد فقط یک‌بار قابل استفاده است. پس از ورود، نشست شما به‌صورت امن ذخیره
            می‌ماند.
          </p>
          <div className="form-grid" style={{ marginTop: "1.6rem" }}>
            <div className="form-group span-2">
              <label htmlFor="login-phone">شماره همراه</label>
              <input
                id="login-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                disabled={loading}
              />
            </div>
          </div>
          {/* Honeypot: invisible to humans; bots fill it and receive a silent fake success. */}
          <input type="text" name="website" autoComplete="off" tabIndex={-1} aria-hidden="true" value="" readOnly className="sr-only" />
          <div className="action-row">
            <button className="button" onClick={() => requestCode(false)} disabled={loading || (challengeId !== null && cooldown > 0)}>
              {loading ? "در حال ارسال…" : challengeId ? "ارسال مجدد کد" : "ارسال کد تأیید"}
            </button>
            {cooldown > 0 && (
              <span className="loading-text" role="status">
                ارسال مجدد تا {cooldown} ثانیه دیگر
              </span>
            )}
          </div>
          {challengeId && (
            <div className="form-grid" style={{ marginTop: "1.2rem" }}>
              <div className="form-group span-2">
                <label htmlFor="login-code">کد ۶ رقمی پیامک‌شده</label>
                <input
                  id="login-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9۰-۹]/g, ""))}
                  placeholder="••••••"
                  disabled={loading}
                />
                <p className="form-hint">کد را در هیچ‌جا به اشتراک نگذارید.</p>
              </div>
            </div>
          )}
          {challengeId && (
            <div className="action-row">
              <button className="button" onClick={verifyCode} disabled={loading || code.length < 6}>
                {loading ? "در حال بررسی…" : "ورود"}
              </button>
            </div>
          )}
          {error && (
            <p className="error-text" role="alert" style={{ marginTop: "1rem" }}>
              {error}
            </p>
          )}
        </div>
        <aside className="trust-panel" aria-label="نکات امنیتی ورود">
          <p className="panel-kicker">امنیت ورود</p>
          <ol>
            <li>کد فقط به همین شماره پیامک می‌شود</li>
            <li>هر کد یک‌بار مصرف و ۵ دقیقه معتبر است</li>
            <li>پس از ۵ تلاش ناموفق، چالش قفل می‌شود</li>
          </ol>
        </aside>
      </main>
    </SiteShell>
  );
}
