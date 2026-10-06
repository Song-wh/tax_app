import Anthropic from "@anthropic-ai/sdk";
import { analyzeTaxProfile } from "@/lib/analyze";
import { getTaxProfile } from "@/lib/providers";

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY 가 .env.local 에 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  try {
    const profile = await getTaxProfile();
    const analysis = await analyzeTaxProfile(profile);
    return Response.json({ analysis });
  } catch (error) {
    let message = error instanceof Error ? error.message : "알 수 없는 오류";
    if (error instanceof Anthropic.AuthenticationError) {
      message = "Claude API 키가 올바르지 않습니다.";
    } else if (error instanceof Anthropic.RateLimitError) {
      message = "요청이 너무 많습니다. 잠시 후 다시 시도하세요.";
    } else if (error instanceof Anthropic.APIError) {
      message = `Claude API 오류 (${error.status}): ${error.message}`;
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
