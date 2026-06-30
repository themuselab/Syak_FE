import { useQuery } from '@tanstack/react-query';

import { getShop, getShops } from './shops.api';
import type { ShopListParams } from './shops.types';

// 샵 목록. params 객체가 쿼리키 → 필터가 바뀌면 자동 refetch.
export function useShops(params: ShopListParams) {
  return useQuery({
    queryKey: ['shops', params],
    queryFn: () => getShops(params),
    staleTime: 60_000, // 백엔드 TTL(5분)과 별개로 클라 기준 1분
  });
}

// 샵 상세.
export function useShop(shopId: string, enabled = true) {
  return useQuery({
    queryKey: ['shops', shopId],
    queryFn: () => getShop(shopId),
    enabled: enabled && !!shopId,
    retry: false,
  });
}
