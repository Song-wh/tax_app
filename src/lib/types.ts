// 세금 데이터 공통 타입. mock / CODEF 어느 소스든 이 형태로 변환해서 사용한다.

export type TaxScope = "personal" | "business";
export type TaxCategory = "national" | "local";

// refundable: 돌려받을 돈 / unpaid: 납부기한 전 미납 / overdue: 체납 / upcoming: 예정 고지 / paid: 완납
export type TaxStatus = "refundable" | "unpaid" | "overdue" | "upcoming" | "paid";

export interface TaxItem {
  id: string;
  scope: TaxScope;
  category: TaxCategory;
  taxType: string; // 예: 종합소득세, 부가가치세, 자동차세
  period: string; // 예: 2025년 귀속, 2026년 1기
  amount: number; // 원 단위
  status: TaxStatus;
  dueDate?: string; // YYYY-MM-DD
  agency: string; // 국세청, 서울특별시 마포구 등
  note?: string;
}

export interface Deduction {
  name: string;
  amount: number;
}

export interface FilingRecord {
  taxType: string;
  year: number; // 귀속연도
  filedAt: string;
  totalIncome: number;
  deductions: Deduction[];
  determinedTax: number; // 결정세액
  prepaidTax: number; // 기납부세액
  note?: string;
}

export interface FamilyMember {
  relation: string;
  age: number;
  annualIncome: number;
  livesTogether: boolean;
  disabled?: boolean;
}

export interface Business {
  name: string;
  bizNo: string;
  vatType: "일반과세자" | "간이과세자" | "면세사업자";
  industry: string;
  openedAt: string;
}

export interface TaxProfile {
  source: "mock" | "codef";
  fetchedAt: string;
  taxpayer: {
    name: string;
    birthYear: number;
    occupation: string;
  };
  family: FamilyMember[];
  businesses: Business[];
  items: TaxItem[];
  filings: FilingRecord[];
  // 신고에 반영됐는지 확인이 필요한 지출/납입 내역 (AI가 누락 공제 판단에 사용)
  extraFacts: string[];
}
