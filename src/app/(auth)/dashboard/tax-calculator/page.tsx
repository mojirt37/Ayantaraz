"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";
import { LogoutButton } from "@/components/public/logout-button";

interface TaxResult {
  grossIncome: string;
  taxableIncome: string;
  tax: string;
  monthlyTax: string;
  breakdown: string[];
  disclaimer: string;
  persisted: boolean;
  warning?: string;
}

const FIELDS = [
  { id: "gross-monthly", key: "gross", label: "درآمد ماهانه (ریال)", hint: "ارقام فارسی یا لاتین؛ جداکننده هزارگان پذیرفته می‌شود.", placeholder: "مثلاً: ۱۵۰٬۰۰۰٬۰۰۰" },
  { id: "ss", key: "mandatorySS", label: "سهم بیمه تأمین اجتماعی", hint: "مبلغ سالانه قابل کسر.", placeholder: "۰" },
  { id: "rent", key: "housingRent", label: "اجاره مسکن", hint: "تا سقف قانونی سالانه لحاظ می‌شود.", placeholder: "۳۰۰٬۰۰۰٬۰۰۰" },
  { id: "health", key: "healthInsurance", label: "بیمه درمان", hint: "تا سقف قانونی سالانه لحاظ می‌شود.", placeholder: "۱۰۰٬۰۰۰٬۰۰۰" },
  { id: "life", key: "lifeInsurance", label: "بیمه عمر", hint: "تا سقف قانونی سالانه لحاظ می‌شود.", placeholder: "۵۰٬۰۰۰٬۰۰۰" },
  { id: "edu", key: "education", label: "هزینه آموزشی", hint: "در صورت وجود مستندات.", placeholder: "۰" },
  { id: "med", key: "medicalExpenses", label: "هزینه‌های درمانی", hint: "در صورت وجود مستندات.", placeholder: "۰" },
] as const;

export default function TaxCalculatorPage() {
  const [values, setValues] = useState<Record<string, string>>({
    gross: "",
    mandatorySS: "0",
    housingRent: "300000000",
    healthInsurance: "100000000",
    lifeInsurance: "50000000",
    education: "0",
    medicalExpenses: "0",
  });
  const [result, setResult] = useState<TaxResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = useCallback((key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  const calculate = useCallback(async () => {
    if (!values["gross"]) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tax/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grossMonthlyIncome: values["gross"],
          deductions: {
            mandatorySocialSecurity: values["mandatorySS"],
            housingRent: values["housingRent"],
            healthInsurance: values["healthInsurance"],
            lifeInsurance: values["lifeInsurance"],
            education: values["education"],
            medicalExpenses: values["medicalExpenses"],
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "authentication required" ? "نشست شما معتبر نیست؛ دوباره وارد شوید." : "ورودی معتبر نیست؛ مبالغ را بازبینی کنید.");
        setResult(null);
        return;
      }
      setResult(data as TaxResult);
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [values]);

  const formatRials = (n: string) => {
    try {
      return BigInt(n).toLocaleString("fa-IR");
    } catch {
      return n;
    }
  };

  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="tax-calc-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">محاسبه‌گر مالیاتی</p>
            <h1 id="tax-calc-title">مالیات درآمد سال ۱۴۰۴، قدم‌به‌قدم و مستند</h1>
            <p className="lead">
              درآمد ماهانه و کسورات خود را وارد کنید. سامانه درآمد سالانه را می‌سازد،
              کسورات قانونی را تا سقف اعمال می‌کند و مالیات را پله‌به‌پله محاسبه می‌نماید؛
              نتیجه همراه شناسنامه قانون ثبت می‌شود.
            </p>
            <Link className="text-link" href="/dashboard/tax-qa">پرسش و پاسخ مالیاتی</Link>
            <LogoutButton />
          </div>
        </section>

        <section className="section" aria-labelledby="calc-form-title">
          <p className="eyebrow">ورودی محاسبه</p>
          <h2 id="calc-form-title">ارقام خود را وارد کنید</h2>
          <div className="form-grid">
            {FIELDS.map((f, i) => (
              <div className={`form-group${i === 0 ? " span-2" : ""}`} key={f.key}>
                <label htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  type="text"
                  inputMode="numeric"
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  aria-describedby={`${f.id}-hint`}
                />
                <p className="form-hint" id={`${f.id}-hint`}>{f.hint}</p>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button className="button" onClick={calculate} disabled={loading || !values["gross"]}>
              {loading ? "در حال محاسبه…" : "محاسبه مالیات"}
            </button>
            {loading && <span className="loading-text" role="status">در حال ارتباط با سرور…</span>}
          </div>
          {error && <p className="error-text" role="alert">{error}</p>}
        </section>

        {result && (
          <section className="section" aria-labelledby="result-title">
            <p className="eyebrow">نتیجه</p>
            <h2 id="result-title">صورت‌حساب محاسبه شما</h2>
            <div className="result-ledger">
              <dl>
                <div className="row"><dt>درآمد سالانه</dt><dd>{formatRials(result.grossIncome)} ریال</dd></div>
                <div className="row"><dt>درآمد مشمول مالیات</dt><dd>{formatRials(result.taxableIncome)} ریال</dd></div>
                <div className="row total"><dt>مالیات سالانه</dt><dd>{formatRials(result.tax)} ریال</dd></div>
                <div className="row"><dt>میانگین ماهانه</dt><dd>{formatRials(result.monthlyTax)} ریال</dd></div>
              </dl>
              <ol className="breakdown">
                {result.breakdown.map((line, i) => <li key={i}>{line}</li>)}
              </ol>
              <p className="disclaimer">{result.disclaimer}</p>
              {result.warning && <p className="error-text" style={{ padding: "0 1.3rem 1rem" }}>{result.warning}</p>}
            </div>
            <div className="action-row">
              <button className="button-ghost" onClick={() => setResult(null)}>محاسبه جدید</button>
            </div>
          </section>
        )}
      </main>
    </SiteShell>
  );
}
