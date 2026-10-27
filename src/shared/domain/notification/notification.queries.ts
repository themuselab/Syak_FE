import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  getAppNews,
  getNotifications,
  getNotificationSettings,
  markNotificationRead,
  markShopNotificationsRead,
  updateNotificationSettings,
} from './notification.api';
import type { NotificationListResponse } from './notification.types';

// 알림 목록. 인증 필요 — 호출부에서 로그인 여부를 enabled로 전달한다.
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: getNotifications,
    enabled,
    select: (d) => d.notifications,
  });
}

// 앱 소식 목록 (전역 피드, 로그인 불필요 — 비회원도 조회).
export function useAppNews() {
  return useQuery({
    queryKey: ['notifications', 'app-news'],
    queryFn: getAppNews,
    select: (d) => d.items,
    staleTime: 60_000,
  });
}

// 알림 1건 읽음 처리(탭한 알림만 — 사용자 확정). favorite.queries.ts 낙관적 업데이트 패턴의 축소판:
// 도트를 즉시 끄고(onMutate), 네트워크류 실패 시 해당 항목만 원복. 서버가 멱등 204라 409/404 분기 없음.
// 응답 본문이 없어 onSuccess 재동기화도 불필요 — 낙관 값이 곧 사실.
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'list'] });
      queryClient.setQueryData<NotificationListResponse>(['notifications', 'list'], (old) => ({
        notifications: (old?.notifications ?? []).map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      }));
    },
    onError: (_error, id) => {
      // 원래 값은 항상 null (호출부가 미읽음일 때만 부름) — 해당 항목만 원복.
      queryClient.setQueryData<NotificationListResponse>(['notifications', 'list'], (old) => ({
        notifications: (old?.notifications ?? []).map((n) =>
          n.id === id ? { ...n, readAt: null } : n,
        ),
      }));
    },
  });
  return (id: string) => mutation.mutate(id);
}

// 샵 상세(/shop/:id) 진입 시 그 샵 알림을 읽음 처리. 푸시를 눌러 바로 샵으로 오면 알림 목록을
// 거치지 않아 안 읽음이 계속 쌓였다(2026-10-27 — 24h 발송 259건 전부 안 읽음). 실패해도 다음 진입에 다시 시도.
export function useMarkShopNotificationsRead(shopId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!shopId || !enabled) return;
    markShopNotificationsRead(shopId)
      .then(() =>
        queryClient.setQueryData<NotificationListResponse>(['notifications', 'list'], (old) =>
          old
            ? {
                notifications: old.notifications.map((n) =>
                  n.shopId === shopId && n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n,
                ),
              }
            : old,
        ),
      )
      .catch(() => {});
  }, [shopId, enabled, queryClient]);
}

// 알림 설정. 인증 필요 — enabled로 제어.
export function useNotificationSettings(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: getNotificationSettings,
    enabled,
  });
}

// 알림 설정 부분 업데이트. PATCH 응답이 전체 설정 객체라
// invalidate(추가 GET) 대신 setQueryData로 캐시를 직접 교체한다.
// 연속 PATCH가 겹치면 마지막 응답이 이기지만, upsert 특성상 실사용 위험 없음.
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (data) => queryClient.setQueryData(['notifications', 'settings'], data),
  });
}
