import { useQuery } from '@tanstack/react-query';

import { getShopSlots } from './reservation.api';

// 샵 예약 가능 슬롯 (오늘부터 3일치).
export function useShopSlots(shopId: string, enabled = true) {
  return useQuery({
    queryKey: ['slots', shopId],
    queryFn: () => getShopSlots(shopId),
    enabled: enabled && !!shopId,
    staleTime: 60_000,
  });
}
