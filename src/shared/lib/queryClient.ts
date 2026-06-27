import { QueryClient } from '@tanstack/react-query';

// 캐시 정책은 백엔드 TTL과 무관하게 클라에서 정한다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      retry: 1,
    },
  },
});
