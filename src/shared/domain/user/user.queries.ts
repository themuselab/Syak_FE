import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { unregisterPushToken } from '@/shared/domain/notification/push';

import { deleteMe, getMe, updateMe } from './user.api';

const ME_KEY = ['user', 'me'] as const;

// 내 프로필 조회. 로그인 상태에서만 의미 있으므로 호출부에서 enabled로 제어한다.
export function useMe(enabled = true) {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: getMe,
    enabled,
    retry: false,
  });
}

// 닉네임 수정. 성공 시 응답(UserProfile)으로 캐시 교체 — 마이·계정관리 화면 즉시 반영.
// ⚠️ PATCH /users/me는 백엔드 미배포(요청 전달 상태) — 배포 전엔 404로 onError 경로.
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (data) => queryClient.setQueryData(ME_KEY, data),
  });
}

// 회원 탈퇴. 탈퇴 전 FCM 기기 토큰 무효화(best-effort — 로그아웃과 동일 패턴).
// 성공 시에만 세션·계정 스코프 캐시 정리(실패 시 세션 유지 — 재시도 가능해야 함).
// 이동(replace('/login'))은 호출부(모달) 담당.
export function useWithdraw() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await unregisterPushToken().catch(() => {});
      return deleteMe();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.removeQueries({ queryKey: ['favorites'] });
      queryClient.removeQueries({ queryKey: ['notifications'] });
      queryClient.removeQueries({ queryKey: ['user'] });
    },
  });
}
