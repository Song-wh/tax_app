import { connection } from "next/server";
import { getTaxProfile } from "@/lib/providers";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  actionLink,
  daysUntil,
  formatWon,
} from "@/lib/format";
import type { TaxItem, TaxProfile } from "@/lib/types";
import AnalysisPanel from "./analysis-panel";

function sum(items: TaxItem[]) {
  return items.reduce((acc, item) => acc + item.amount, 0);
}

export default async function Home() {
  await connection();

  let profile: TaxProfile;
  try {
    profile = await getTaxProfile();
  } catch (error) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">내 세금 한눈에</h1>
        <p className="mt-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
          데이터를 불러오지 못했습니다: {error instanceof Error ? error.message : String(error)}
        </p>
      </main>
    );
  }

  const refundable = profile.items.filter((i) => i.status === "refundable");
  const toPay = profile.items.filter((i) => i.status === "unpaid" || i.status === "upcoming");
  const overdue = profile.items.filter((i) => i.status === "overdue");

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">내 세금 한눈에</h1>
          <p className="text-sm text-zinc-500">
            {profile.taxpayer.name} · {profile.taxpayer.occupation}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {profile.source === "mock" ? "샘플 데이터" : "CODEF 실데이터"} · 조회{" "}
          {new Date(profile.fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
        </span>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="돌려받을 돈" amount={sum(refundable)} count={refundable.length} tone="text-emerald-600" />
        <SummaryCard label="내야 할 돈" amount={sum(toPay)} count={toPay.length} tone="text-sky-600" />
        <SummaryCard label="체납" amount={sum(overdue)} count={overdue.length} tone="text-red-600" />
      </section>

      <AnalysisPanel />

      <ItemTable title="국세 (홈택스)" items={profile.items.filter((i) => i.category === "national")} />
      <ItemTable title="지방세 (위택스)" items={profile.items.filter((i) => i.category === "local")} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">신고 이력</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="p-3">귀속연도</th>
                <th className="p-3">세목</th>
                <th className="p-3 text-right">총소득</th>
                <th className="p-3">반영된 공제</th>
                <th className="p-3 text-right">결정세액</th>
              </tr>
            </thead>
            <tbody>
              {profile.filings.map((f) => (
                <tr key={`${f.taxType}-${f.year}`} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="p-3">{f.year}</td>
                  <td className="p-3">{f.taxType}</td>
                  <td className="p-3 text-right">{formatWon(f.totalIncome)}</td>
                  <td className="p-3 text-zinc-500">{f.deductions.map((d) => d.name).join(", ")}</td>
                  <td className="p-3 text-right">{formatWon(f.determinedTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="pb-8 text-xs text-zinc-500">
        이 앱은 조회와 분석을 돕는 도구입니다. 환급 신청과 납부는 홈택스·위택스에서 직접 확인 후 진행하세요.
        복잡한 사안은 세무사 상담을 권장합니다.
      </footer>
    </main>
  );
}

function SummaryCard({ label, amount, count, tone }: { label: string; amount: number; count: number; tone: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{formatWon(amount)}</p>
      <p className="mt-1 text-xs text-zinc-500">{count}건</p>
    </div>
  );
}

function ItemTable({ title, items }: { title: string; items: TaxItem[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="p-3">구분</th>
              <th className="p-3">세목 / 기간</th>
              <th className="p-3 text-right">금액</th>
              <th className="p-3">상태</th>
              <th className="p-3">기한</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const action = actionLink(item);
              const days = item.dueDate ? daysUntil(item.dueDate) : null;
              return (
                <tr key={item.id} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                  <td className="p-3 text-zinc-500">{item.scope === "personal" ? "개인" : "사업자"}</td>
                  <td className="p-3">
                    <div className="font-medium">{item.taxType}</div>
                    <div className="text-xs text-zinc-500">
                      {item.period} · {item.agency}
                    </div>
                    {item.note && <div className="mt-1 text-xs text-zinc-500">{item.note}</div>}
                  </td>
                  <td className="p-3 text-right font-medium">{formatWon(item.amount)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {item.dueDate ?? "-"}
                    {days !== null && item.status !== "paid" && (
                      <div className={days < 0 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-zinc-500"}>
                        {days < 0 ? `${-days}일 지남` : `D-${days}`}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {action && (
                      <a
                        href={action.href}
                        target="_blank"
                        rel="noreferrer"
                        className="whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        {action.label}
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
