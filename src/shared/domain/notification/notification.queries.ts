import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  getNotificationSettings,
  updateNotificationSettings,
} from './notification.api';

// 알림 목록. 인증 필요 — 호출부에서 로그인 여부를 enabled로 전달한다.
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: getNotifications,
    enabled,
    select: (d) => d.notifications,
  });
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
