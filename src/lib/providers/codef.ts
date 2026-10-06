import type { TaxProfile } from "../types";

// CODEF(https://codef.io) 연동.
// 1단계: client_credentials 로 액세스 토큰 발급 (구현됨)
// 2단계: 홈택스/위택스 상품 API 호출 + 간편인증 2-way 흐름 (다음 단계에서 구현)

const OAUTH_URL = "https://oauth.codef.io/oauth/token";

const API_HOSTS = {
  sandbox: "https://sandbox.codef.io",
  demo: "https://development.codef.io",
  production: "https://api.codef.io",
} as const;

export function codefConfig() {
  const clientId = process.env.CODEF_CLIENT_ID;
  const clientSecret = process.env.CODEF_CLIENT_SECRET;
  const publicKey = process.env.CODEF_PUBLIC_KEY;
  const env = (process.env.CODEF_ENV ?? "sandbox") as keyof typeof API_HOSTS;

  if (!clientId || !clientSecret) {
    throw new Error(
      "CODEF_CLIENT_ID / CODEF_CLIENT_SECRET 가 .env.local 에 설정되지 않았습니다.",
    );
  }
  return { clientId, clientSecret, publicKey, env, apiHost: API_HOSTS[env] };
}

export async function getCodefToken(): Promise<string> {
  const { clientId, clientSecret } = codefConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=read",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`CODEF 토큰 발급 실패 (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function fetchCodefProfile(): Promise<TaxProfile> {
  // 토큰 발급까지 확인해서 키가 올바른지 먼저 검증한다.
  await getCodefToken();
  throw new Error(
    "CODEF 키는 정상입니다. 홈택스/위택스 조회(간편인증) 연동은 아직 구현 전입니다. DATA_SOURCE=mock 으로 사용하세요.",
  );
}
