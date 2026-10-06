"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/analyze";
import { formatWon } from "@/lib/format";

const CONFIDENCE_LABEL = { high: "가능성 높음", medium: "확인 필요", low: "가능성 낮음" } as const;

export default function AnalysisPanel() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석 실패");
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">AI 세금 분석</h2>
          <p className="text-sm text-zinc-500">놓친 환급, 경정청구 대상, 납부 우선순위를 찾아줍니다.</p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "분석 중… (1~2분)" : analysis ? "다시 분석" : "분석 시작"}
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}

      {analysis && (
        <div className="mt-5 space-y-6 text-sm">
          <p className="leading-relaxed">{analysis.summary}</p>

          {analysis.refundOpportunities.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-400">돌려받을 수 있는 돈</h3>
              <ul className="space-y-3">
                {analysis.refundOpportunities.map((r, i) => (
                  <li key={i} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{r.title}</span>
                      <span className="font-bold text-emerald-600">약 {formatWon(r.estimatedAmount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {r.taxType}
                      {r.year ? ` · ${r.year}년 귀속` : ""} · {CONFIDENCE_LABEL[r.confidence]}
                      {r.deadline ? ` · 기한 ${r.deadline}` : ""}
                    </p>
                    <p className="mt-2">{r.reason}</p>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                      <b>방법:</b> {r.howTo}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.paymentPriorities.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-red-700 dark:text-red-400">납부 우선순위</h3>
              <ol className="list-decimal space-y-2 pl-5">
                {analysis.paymentPriorities.map((p, i) => (
                  <li key={i}>
                    <span className="font-medium">{p.title}</span> {formatWon(p.amount)}
                    {p.dueDate ? ` (기한 ${p.dueDate})` : ""}
                    <div className="text-zinc-500">{p.reason}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {analysis.upcomingDeadlines.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">다가오는 기한</h3>
              <ul className="space-y-1">
                {analysis.upcomingDeadlines.map((d, i) => (
                  <li key={i}>
                    <span className="font-mono text-xs">{d.date}</span> {d.title}{" "}
                    <span className="text-zinc-500">— {d.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.warnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <h3 className="mb-1 font-semibold">확인이 필요한 점</h3>
              <ul className="list-disc pl-5">
                {analysis.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
