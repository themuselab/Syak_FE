import { API_URL } from '@/shared/lib/env';
import { ApiError, ErrorCode, type ApiErrorBody } from '@/shared/api/errors';
import { refreshSession } from '@/shared/api/refresh';

// 응답 대기 상한. 넘기면 TIMEOUT ApiError. 없으면 서버가 응답을 안 줄 때 화면이 영원히
// 로딩에 머문다(QA 3차 "무한 로딩" 제보의 원인 중 하나).
const DEFAULT_TIMEOUT_MS = 15_000;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  // 토큰 만료 시 자동 refresh 후 1회 재시도할지 (기본 true). refresh 호출 자체에서는 false.
  retryOnAuthExpired?: boolean;
  timeoutMs?: number;
};

// 모든 API 요청의 단일 진입점.
// - HTTP-only 쿠키 자동 전송 (credentials: 'include')
// - 공통 에러 { code, message, details } 파싱 → ApiError
// - AUTH_TOKEN_EXPIRED 수신 시 refresh 후 원요청 재시도
// - 네트워크 실패·타임아웃도 ApiError로 정규화 (호출부가 code로 분기할 수 있게)
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, retryOnAuthExpired = true, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } =
    options;

  const res = await fetchWithTimeout(
    `${API_URL}${path}`,
    {
      ...rest,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    timeoutMs,
  );

  if (res.ok) {
    return parseBody<T>(res);
  }

  const errorBody = await parseErrorBody(res);

  if (
    res.status === 401 &&
    errorBody.code === ErrorCode.AUTH_TOKEN_EXPIRED &&
    retryOnAuthExpired
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, retryOnAuthExpired: false });
    }
    // refresh 실패 → 재로그인 필요. AUTH_REFRESH_INVALID 로 변환해 상위에서 로그인 이동 처리.
    throw new ApiError(401, {
      code: ErrorCode.AUTH_REFRESH_INVALID,
      message: '다시 로그인해 주세요',
    });
  }

  throw new ApiError(res.status, errorBody);
}

// fetch는 서버에 닿지 못하면 TypeError를 던진다. 그대로 두면 호출부에서 "알 수 없는 오류"가 되어
// 오프라인·DNS 실패·cleartext 차단이 서버 에러와 구분되지 않는다 → ApiError(code)로 정규화.
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (controller.signal.aborted) {
      throw new ApiError(0, {
        code: ErrorCode.TIMEOUT,
        message: '응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요',
      });
    }
    throw new ApiError(0, {
      code: ErrorCode.NETWORK_ERROR,
      message: '네트워크에 연결할 수 없어요',
      details: { cause: e instanceof Error ? e.message : String(e) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody> {
  try {
    return (await res.json()) as ApiErrorBody;
  } catch {
    return { code: ErrorCode.INTERNAL_ERROR, message: '알 수 없는 오류가 발생했습니다' };
  }
}
