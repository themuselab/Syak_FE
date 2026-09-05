import { apiFetch } from '@/shared/api/client';
import type { SocialLoginResponse, SocialProvider } from './auth.types';

// POST /auth/:provider — 소셜 로그인 (응답 쿠키 자동 설정)
// name: 애플 최초 로그인 때만 전달(백엔드가 닉네임 보완). 카카오/네이버는 프로필에 닉네임이 있어 생략.
export function socialLogin(provider: SocialProvider, accessToken: string, name?: string) {
  return apiFetch<SocialLoginResponse>(`/auth/${provider}`, {
    method: 'POST',
    body: name ? { access_token: accessToken, name } : { access_token: accessToken },
  });
}

// DELETE /auth/signout — 로그아웃
export function signOut() {
  return apiFetch<void>('/auth/signout', { method: 'DELETE' });
}
