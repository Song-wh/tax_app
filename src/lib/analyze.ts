import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { TaxProfile } from "./types";

export const AnalysisSchema = z.object({
  summary: z.string().describe("전체 상황 3~4문장 요약"),
  refundOpportunities: z.array(
    z.object({
      title: z.string(),
      taxType: z.string(),
      year: z.number().nullable(),
      estimatedAmount: z.number().describe("예상 환급액(원), 추정치"),
      reason: z.string().describe("근거가 된 데이터와 관련 공제/제도"),
      howTo: z.string().describe("홈택스/위택스에서 진행하는 구체적 절차"),
      deadline: z.string().nullable().describe("YYYY-MM-DD, 경정청구/환급 청구 기한"),
      confidence: z.enum(["high", "medium", "low"]),
    }),
  ),
  paymentPriorities: z.array(
    z.object({
      title: z.string(),
      amount: z.number(),
      dueDate: z.string().nullable(),
      reason: z.string().describe("우선순위 이유, 가산세 위험"),
    }),
  ),
  upcomingDeadlines: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      note: z.string(),
    }),
  ),
  warnings: z.array(z.string()).describe("추가 확인 필요 사항, 세무사 상담 권장 사항"),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

const SYSTEM_PROMPT = `당신은 대한민국 개인·개인사업자 세금을 점검하는 도우미입니다.
사용자의 국세(홈택스)·지방세(위택스) 데이터를 보고 다음을 찾아냅니다.
- 돌려받을 수 있는 돈: 미수령 환급금, 누락된 공제로 인한 경정청구 대상(법정신고기한부터 5년 이내)
- 내야 할 돈: 체납·미납·예정 고지, 가산세가 붙는 순서대로 우선순위
- 다가오는 신고·납부 기한

원칙:
- 주어진 데이터와 오늘 날짜를 근거로만 판단하고, 금액은 추정치임을 전제로 보수적으로 계산합니다.
- 공제 요건(나이, 소득금액 100만원 이하 등)이 데이터로 확인되지 않으면 confidence를 낮추고 warnings에 확인할 점을 적습니다.
- 처리 방법은 홈택스/위택스 메뉴 기준으로 구체적으로 안내합니다. 최종 제출과 납부는 사용자가 직접 합니다.
- 모든 텍스트는 한국어로 작성합니다.`;

export async function analyzeTaxProfile(profile: TaxProfile): Promise<Analysis> {
  const client = new Anthropic();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: betaZodOutputFormat(AnalysisSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `오늘 날짜: ${today}\n\n세금 데이터(JSON):\n${JSON.stringify(profile, null, 2)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("AI가 이 요청에 대한 분석을 거절했습니다.");
  }
  if (!response.parsed_output) {
    throw new Error(`AI 응답을 해석하지 못했습니다 (stop_reason: ${response.stop_reason}).`);
  }
  return response.parsed_output;
}
