import { useState, useCallback } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/public/site-shell";

interface TreeNode {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
}

interface AnswerNode {
  kind: "ANSWER";
  answer: {
    knowledgeVersionId: string;
    sourceReference: string;
    effectiveFrom: string;
    content: string;
  };
}

interface ClarificationNode {
  kind: "CLARIFICATION";
  node: TreeNode;
}

interface NoAnswer {
  kind: "NO_APPROVED_ANSWER";
}

type QAResponse = TreeNode | AnswerNode | NoAnswer;

export default function TaxQAStartPage() {
  const [node, setNode] = useState<TreeNode | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sourceRef, setSourceRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startQA = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tax/qa");
      const data: QAResponse = await res.json();
      if ("prompt" in data) {
        setNode(data as TreeNode);
        setAnswer(null);
        setSourceRef(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const selectOption = useCallback(async (optionId: string) => {
    if (!node) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tax/qa?nodeId=${node.id}&optionId=${optionId}`);
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
        setAnswer("متأسفانه پاسخ تأییدشده‌ای برای این مسیر یافت نشد. لطفاً مشاوره بگیرید.");
        setNode(null);
        setSourceRef(null);
      }
    } finally {
      setLoading(false);
    }
  }, [node]);

  return (
    <SiteShell>
      <main>
        <section className="hero" aria-labelledby="tax-qa-workspace-title">
          <div className="hero-copy">
            <p className="eyebrow">فضای تعاملی مالیاتی</p>
            <h1 id="tax-qa-workspace-title">سیستم پرسش و پاسخ مالیاتی</h1>
            <p className="lead">
              با پیشرفت تدریجی، سؤال خود را مطرح کنید و از دیکشنری قانونی تأییدشده پاسخ دریافت کنید.
            </p>
            <button className="button" onClick={startQA} disabled={loading}>
              {loading ? "در حال بارگذاری..." : "شروع پرسش مالیاتی"}
            </button>
            <Link className="text-link" href="/">بازگشت به خانه</Link>
          </div>
        </section>

        <section aria-labelledby="workspace-title">
          <h2 id="workspace-title">پنجره مکالمه</h2>
          <div className="qa-workspace">
            {!node && !answer && !loading && (
              <p className="empty-state">برای شروع، دکمه بالا را بزنید.</p>
            )}
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
                {sourceRef && <p className="qa-source">منبع: {sourceRef}</p>}
                <button className="button" onClick={startQA} disabled={loading}>سؤال بعدی</button>
              </div>
            )}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
