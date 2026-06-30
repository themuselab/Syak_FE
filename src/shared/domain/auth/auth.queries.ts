import { useMutation } from '@tanstack/react-query';
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
  return useMutation({
    mutationFn: signOut,
    // 성공/실패(AUTH_UNAUTHORIZED = 이미 로그아웃) 모두 로컬 세션을 비운다.
    onSettled: () => setUser(null),
  });
}
