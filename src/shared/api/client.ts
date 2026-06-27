import { API_URL } from '@/shared/lib/env';
import { ApiError, ErrorCode, type ApiErrorBody } from '@/shared/api/errors';
import { refreshSession } from '@/shared/api/refresh';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  // 토큰 만료 시 자동 refresh 후 1회 재시도할지 (기본 true). refresh 호출 자체에서는 false.
  retryOnAuthExpired?: boolean;
};

// 모든 API 요청의 단일 진입점.
// - HTTP-only 쿠키 자동 전송 (credentials: 'include')
// - 공통 에러 { code, message, details } 파싱 → ApiError
// - AUTH_TOKEN_EXPIRED 수신 시 refresh 후 원요청 재시도
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, retryOnAuthExpired = true, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
