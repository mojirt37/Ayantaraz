"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";

interface TaxResult {
  grossIncome: bigint;
  taxableIncome: bigint;
  tax: bigint;
  monthlyTax: bigint;
  breakdown: string[];
  disclaimer: string;
}

export default function TaxCalculatorPage() {
  const [grossMonthly, setGrossMonthly] = useState("");
  const [deductions, setDeductions] = useState({
    mandatorySS: "0",
    housingRent: "300000000",
    healthInsurance: "100000000",
    lifeInsurance: "50000000",
    education: "0",
    medicalExpenses: "0",
  });
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = useCallback(async () => {
    if (!grossMonthly) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tax/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grossMonthlyIncome: grossMonthly, deductions }),
      });
      const data: TaxResult = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [grossMonthly, deductions]);

  const formatRials = (n: bigint) => n.toLocaleString("fa-IR");

  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="tax-calc-title">
          <div className="hero-copy">
            <p className="eyebrow">ماشین‌حساب مالیاتی</p>
            <h1 id="tax-calc-title">محاسبه دقیق مالیات درآمد ۱۴۰۴</h1>
            <p className="lead">
              درآمد ماهانه خود را وارد کنید تا مالیات تخمینی سالانه بر اساس آیین‌نامه مالیات درآمد افراد طبیعی محاسبه شود.
            </p>
            <Link className="text-link" href="/tax-qa">پرسش و پاسخ مالیاتی</Link>
          </div>
        </section>

        <section aria-labelledby="calc-form-title">
          <h2 id="calc-form-title">پارامترهای محاسبه</h2>
          <div className="calc-form">
            <div className="form-group">
              <label htmlFor="gross-monthly">درآمد ماهانه (ریال)</label>
              <input id="gross-monthly" type="text" inputMode="numeric" value={grossMonthly} onChange={(e) => setGrossMonthly(e.target.value)} placeholder="مثلاً: ۱۵۰۰۰۰۰۰۰۰" />
            </div>
            <div className="form-group">
              <label htmlFor="ss">تابعیت اجباری سازمانی</label>
              <input id="ss" type="text" inputMode="numeric" value={deductions.mandatorySS} onChange={(e) => setDeductions({ ...deductions, mandatorySS: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="rent">اجاره مسکن</label>
              <input id="rent" type="text" inputMode="numeric" value={deductions.housingRent} onChange={(e) => setDeductions({ ...deductions, housingRent: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="health">بیمه درمان</label>
              <input id="health" type="text" inputMode="numeric" value={deductions.healthInsurance} onChange={(e) => setDeductions({ ...deductions, healthInsurance: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="life">بیمه عمر</label>
              <input id="life" type="text" inputMode="numeric" value={deductions.lifeInsurance} onChange={(e) => setDeductions({ ...deductions, lifeInsurance: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="edu">هزینه آموزشی</label>
              <input id="edu" type="text" inputMode="numeric" value={deductions.education} onChange={(e) => setDeductions({ ...deductions, education: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="med">هزینه‌های درمانی</label>
              <input id="med" type="text" inputMode="numeric" value={deductions.medicalExpenses} onChange={(e) => setDeductions({ ...deductions, medicalExpenses: e.target.value })} />
            </div>
            <button className="button" onClick={calculate} disabled={loading || !grossMonthly}>
              {loading ? "در حال محاسبه..." : "محاسبه مالیات"}
            </button>
          </div>
        </section>

        {result && (
          <section aria-labelledby="result-title">
            <h2 id="result-title">نتیجه محاسبه</h2>
            <div className="result-card">
              <p>درآمد سالانه: <strong>{formatRials(result.grossIncome)}</strong> ریال</p>
              <p>درآمد مالیاتی: <strong>{formatRials(result.taxableIncome)}</strong> ریال</p>
              <p>مالیات سالانه: <strong>{formatRials(result.tax)}</strong> ریال</p>
              <p>مالیات ماهانه: <strong>{formatRials(result.monthlyTax)}</strong> ریال</p>
              <h3>جزئیات محاسبه:</h3>
              <ul>
                {result.breakdown.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
              <p className="disclaimer">{result.disclaimer}</p>
              <button className="button" onClick={() => setResult(null)}>محاسبه جدید</button>
            </div>
          </section>
        )}
      </main>
    </SiteShell>
  );
}
