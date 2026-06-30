import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { ApiError, ErrorCode } from '@/shared/api/errors';
import { useAuthStore } from '@/shared/domain/auth/auth.store';

// 인증 만료 흐름:
// - AUTH_TOKEN_EXPIRED → apiFetch가 자동 refresh 후 재시도(여기 안 옴).
// - refresh 실패 → apiFetch가 AUTH_REFRESH_INVALID로 변환해 던짐 → 여기서 한 번에 처리.
function handleGlobalError(error: unknown) {
  if (error instanceof ApiError && error.code === ErrorCode.AUTH_REFRESH_INVALID) {
    useAuthStore.getState().setUser(null);
    router.replace('/login');
  }
}

// 인증 계열 에러는 재시도해도 결과가 같으므로 재시도하지 않는다.
const NO_RETRY_CODES: string[] = [
  ErrorCode.AUTH_REFRESH_INVALID,
  ErrorCode.AUTH_UNAUTHORIZED,
  ErrorCode.AUTH_TOKEN_EXPIRED,
  ErrorCode.AUTH_INVALID_TOKEN,
];

// 캐시 정책은 백엔드 TTL과 무관하게 클라에서 정한다.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleGlobalError }),
  mutationCache: new MutationCache({ onError: handleGlobalError }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      retry: (failureCount, error) => {
        if (error instanceof ApiError && NO_RETRY_CODES.includes(error.code)) return false;
        return failureCount < 1;
      },
    },
  },
});
