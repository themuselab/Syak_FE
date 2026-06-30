import { apiFetch } from '@/shared/api/client';
import type { UserProfile } from './user.types';

// GET /users/me — 내 프로필 (쿠키 인증). 비로그인 시 AUTH_UNAUTHORIZED(401).
export function getMe() {
  return apiFetch<UserProfile>('/users/me');
}
