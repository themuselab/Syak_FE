import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createSlotAlerts, deleteSlotAlerts, getSlotAlerts } from './slotAlert.api';

export const SLOT_ALERTS_KEY = ['notifications', 'slot-alerts'] as const;

// 빈자리 알림 신청 목록. 인증 필요 — 호출부가 로그인 여부를 enabled로 넘긴다.
export function useSlotAlerts(enabled: boolean) {
  return useQuery({
    queryKey: SLOT_ALERTS_KEY,
    queryFn: getSlotAlerts,
    enabled,
    select: (d) => d.alerts,
    staleTime: 30_000,
  });
}

// 신청. 성공하면 목록을 다시 받는다(서버가 중복 시간을 걸러낼 수 있어 낙관 갱신 대신 재조회).
export function useCreateSlotAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSlotAlerts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SLOT_ALERTS_KEY }),
  });
}

// 여러 건 삭제(편집 "완료").
export function useDeleteSlotAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSlotAlerts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SLOT_ALERTS_KEY }),
  });
}
