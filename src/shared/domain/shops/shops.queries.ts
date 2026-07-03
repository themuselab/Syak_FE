import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getShop, getShops } from './shops.api';
import type { ShopListParams } from './shops.types';

// 샵 목록 무한스크롤. params(page 제외) 객체가 쿼리키 → 필터가 바뀌면 1페이지부터 리셋.
// page는 pageParam이 관리하고, 다음 페이지 유무는 서버 응답(total/page/limit)으로 계산.
export function useShops(params: Omit<ShopListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['shops', params],
    queryFn: ({ pageParam }) => getShops({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
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
