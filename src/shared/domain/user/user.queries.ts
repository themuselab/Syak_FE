import { useQuery } from '@tanstack/react-query';
import { getMe } from './user.api';

// 내 프로필 조회. 로그인 상태에서만 의미 있으므로 호출부에서 enabled로 제어한다.
export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    enabled,
    retry: false,
  });
}
