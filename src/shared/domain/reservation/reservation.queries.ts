import { useQuery } from '@tanstack/react-query';

import { getShopSlots, searchAvailableSlots } from './reservation.api';
import type { SlotSearchParams } from './reservation.types';

// 샵 예약 가능 슬롯 (오늘부터 3일치).
export function useShopSlots(shopId: string, enabled = true) {
  return useQuery({
    queryKey: ['slots', shopId],
    queryFn: () => getShopSlots(shopId),
    enabled: enabled && !!shopId,
    staleTime: 60_000,
  });
}

// 예약시간 필터: 날짜×시간에 빈 슬롯 있는 샵 검색. (홈에서 목록과 교집합)
export function useSlotSearch(params: SlotSearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ['slots', 'search', params],
    queryFn: () => searchAvailableSlots(params),
    enabled: enabled && params.dates.length > 0 && params.times.length > 0,
    staleTime: 60_000,
  });
}
