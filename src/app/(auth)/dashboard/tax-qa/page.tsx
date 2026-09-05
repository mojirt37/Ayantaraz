"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";
import { LogoutButton } from "@/components/public/logout-button";
import { SourceLine } from "@/components/public/source-line";

interface TreeNode {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
}

interface AnswerPayload {
  kind: "ANSWER";
  answer: {
    knowledgeVersionId: string;
    sourceReference: string;
    effectiveFrom: string;
    content: string;
  };
}

interface NoAnswer {
  kind: "NO_APPROVED_ANSWER";
}

type QAResponse = TreeNode | AnswerPayload | NoAnswer;

export default function TaxQAStartPage() {
  const [node, setNode] = useState<TreeNode | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sourceRef, setSourceRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startQA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tax/qa");
      if (!res.ok) throw new Error("request failed");
      const data: QAResponse = await res.json();
      if ("prompt" in data) {
        setNode(data as TreeNode);
        setAnswer(null);
        setSourceRef(null);
      } else {
        setError("در حال حاضر مسیر پرسش در دسترس نیست؛ دوباره تلاش کنید.");
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectOption = useCallback(async (optionId: string) => {
    if (!node) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tax/qa?nodeId=${encodeURIComponent(node.id)}&optionId=${encodeURIComponent(optionId)}`);
      if (!res.ok && res.status !== 404) throw new Error("request failed");
      const data: QAResponse = await res.json();
      if ("prompt" in data) {
        setNode(data as TreeNode);
        setAnswer(null);
        setSourceRef(null);
      } else if ("kind" in data && data.kind === "ANSWER") {
        setAnswer(data.answer.content);
        setSourceRef(data.answer.sourceReference);
        setNode(null);
      } else {
        setAnswer("برای این مسیر، منبع تأییدشده‌ای ثبت نشده است. برای بررسی پرونده خود، مشاوره تخصصی درخواست کنید.");
        setNode(null);
        setSourceRef(null);
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }, [node]);

  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="tax-qa-workspace-title">
          <div className="hero-copy reveal">
            <p className="eyebrow">میزکار پرسش مالیاتی</p>
            <h1 id="tax-qa-workspace-title">قدم‌به‌قدم تا پاسخ مستند</h1>
            <p className="lead">
              حوزه پرسش خود را انتخاب کنید و مسیر را دنبال نمایید. هر پاسخ با منبع
              قانونی و تاریخ مؤثر نمایش داده می‌شود؛ در نبود منبع، پاسخی ساخته نمی‌شود.
            </p>
            <div className="action-row">
            <button className="button" onClick={startQA} disabled={loading}>
              {loading ? "در حال بارگذاری…" : "شروع پرسش"}
            </button>
            <Link className="text-link" href="/">بازگشت به خانه</Link>
            <LogoutButton />
            <LogoutButton scope="all" />
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="workspace-title" aria-live="polite">
          <p className="eyebrow">گفت‌وگو</p>
          <h2 id="workspace-title">مسیر پرسش شما</h2>
          <div className="qa-workspace">
            {!node && !answer && !loading && !error && (
              <p className="empty-state">برای شروع، دکمه «شروع پرسش» را بزنید.</p>
            )}
            {loading && <p className="loading-text" role="status">در حال دریافت مرحله بعد…</p>}
            {error && <p className="error-text" role="alert">{error}</p>}
            {node && (
              <div className="qa-node">
                <p className="qa-prompt">{node.prompt}</p>
                <div className="qa-options">
                  {node.options.map((opt) => (
                    <button key={opt.id} className="qa-option" onClick={() => selectOption(opt.id)} disabled={loading}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {answer && (
              <div className="qa-answer">
                <p className="qa-content">{answer}</p>
                {sourceRef && <SourceLine source={sourceRef} />}
                <div className="action-row">
                  <button className="button-ghost" onClick={startQA} disabled={loading}>پرسش بعدی</button>
                  <Link className="text-link" href="/consultation">درخواست مشاوره</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
