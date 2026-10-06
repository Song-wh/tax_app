import type { TaxItem, TaxStatus } from "./types";

const won = new Intl.NumberFormat("ko-KR");

export function formatWon(amount: number): string {
  return `${won.format(amount)}원`;
}

export const STATUS_LABEL: Record<TaxStatus, string> = {
  refundable: "환급 가능",
  unpaid: "미납",
  overdue: "체납",
  upcoming: "납부 예정",
  paid: "완납",
};

export const STATUS_STYLE: Record<TaxStatus, string> = {
  refundable: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  unpaid: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  upcoming: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  paid: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

// 실제 처리(환급 신청/납부)는 사용자가 공식 사이트에서 직접 확인 후 진행한다.
export function actionLink(item: TaxItem): { label: string; href: string } | null {
  const site =
    item.category === "national" ? "https://hometax.go.kr" : "https://www.wetax.go.kr";
  if (item.status === "refundable") return { label: "환급 신청", href: site };
  if (item.status === "unpaid" || item.status === "overdue" || item.status === "upcoming") {
    return { label: "납부하기", href: site };
  }
  return null;
}

export function daysUntil(date: string, today = new Date()): number {
  const target = new Date(`${date}T00:00:00+09:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}
