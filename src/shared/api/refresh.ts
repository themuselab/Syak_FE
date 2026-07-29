import { API_URL } from '@/shared/lib/env';

// 동시에 여러 요청이 토큰 만료를 받아도 refresh 는 한 번만 실행한다 (single-flight).
let refreshPromise: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
  // 응답이 안 오면 원요청까지 함께 매달린다 → 상한을 둔다(client.ts와 동일 정책).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    // syak_refresh 쿠키가 자동 전송된다. 성공 시 204 + 새 쿠키.
    const res = await fetch(`${API_URL}/auth/token/refresh`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    });
    return res.status === 204;
  } catch {
    // 주의: 네트워크 실패도 false가 되어 호출부에서 AUTH_REFRESH_INVALID(재로그인)로 승격된다.
    // 일시적 장애로 세션이 끊기는 셈이라 개선 여지가 있으나, 동작 변경이라 별도 건으로 둔다.
    return false;
  } finally {
    clearTimeout(timer);
  }
}
