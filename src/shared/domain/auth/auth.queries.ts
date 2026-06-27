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
    onSuccess: () => setUser(null),
  });
}
