import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unregisterPushToken } from '@/shared/domain/notification/push';

import { signOut, socialLogin } from './auth.api';
import { useAuthStore } from './auth.store';
import type { SocialProvider } from './auth.types';

export function useSocialLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (vars: { provider: SocialProvider; accessToken: string }) =>
      socialLogin(vars.provider, vars.accessToken),
    onSuccess: (data) => setUser(data.user),
  });
}

export function useSignOut() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    // 로그아웃 전에 FCM 기기 토큰 무효화(best-effort) — 로그아웃 후에도 푸시가 오는 것 방지.
    mutationFn: async () => {
      await unregisterPushToken().catch(() => {});
      return signOut();
    },
    // 성공/실패(AUTH_UNAUTHORIZED = 이미 로그아웃) 모두 로컬 세션을 비운다.
    // 계정 스코프 캐시(즐겨찾기·알림)도 제거 — 다른 계정으로 재로그인 시 이전 계정 데이터 노출/오조작 방지.
    onSettled: () => {
      setUser(null);
      queryClient.removeQueries({ queryKey: ['favorites'] });
      queryClient.removeQueries({ queryKey: ['notifications'] });
      queryClient.removeQueries({ queryKey: ['user'] });
    },
  });
}
