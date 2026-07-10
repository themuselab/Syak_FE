import { apiFetch } from '@/shared/api/client';
import type { UserProfile } from './user.types';

// GET /users/me — 내 프로필 (쿠키 인증). 비로그인 시 AUTH_UNAUTHORIZED(401).
export function getMe() {
  return apiFetch<UserProfile>('/users/me');
}

// PATCH /users/me — 닉네임 수정. ⚠️ 백엔드 미배포(2026-07-10 요청 전달 — docs/account.md §BE 전달)
// 계약 제안: body {nickname} → 200 UserProfile. 배포 전까지 호출 시 404 → 화면에서 실패 안내.
export function updateMe(input: { nickname: string }) {
  return apiFetch<UserProfile>('/users/me', { method: 'PATCH', body: input });
}

// DELETE /users/me — 회원 탈퇴. 204 + 서버가 쿠키 만료(즐겨찾기·알림·토큰은 DB CASCADE 삭제).
export function deleteMe() {
  return apiFetch<void>('/users/me', { method: 'DELETE' });
}
