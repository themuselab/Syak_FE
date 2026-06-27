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
  try {
    // syak_refresh 쿠키가 자동 전송된다. 성공 시 204 + 새 쿠키.
    const res = await fetch(`${API_URL}/auth/token/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.status === 204;
  } catch {
    return false;
  }
}
