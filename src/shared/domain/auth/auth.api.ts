import { apiFetch } from '@/shared/api/client';
import type { SocialLoginResponse, SocialProvider } from './auth.types';

// POST /auth/:provider — 소셜 로그인 (응답 쿠키 자동 설정)
export function socialLogin(provider: SocialProvider, accessToken: string) {
  return apiFetch<SocialLoginResponse>(`/auth/${provider}`, {
    method: 'POST',
    body: { access_token: accessToken },
  });
}

// DELETE /auth/signout — 로그아웃
export function signOut() {
  return apiFetch<void>('/auth/signout', { method: 'DELETE' });
}
