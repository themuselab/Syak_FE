import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getShop, getShopPins, getShops } from './shops.api';
import type { MapBounds, ShopListParams } from './shops.types';

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
    // 내 주변 토글·필터 변경으로 쿼리키가 바뀌어도 이전 목록을 유지한 채 갱신한다(QA #56).
    // 없으면 isLoading=true가 되어 목록이 통째로 스피너로 교체됐다가 다시 나타난다.
    placeholderData: keepPreviousData,
  });
}

// 지도 영역 핀(웹처럼 화면영역 전체 샵). 목록(useShops, 반경+페이지)과 별개로 마커만 담당한다.
// bounds가 없으면(첫 카메라 idle 전) 비활성. 잦은 팬으로 인한 재조회는 키를 소수 3자리로 반올림해 억제.
export function useShopPins(bounds: MapBounds | null) {
  const key = bounds
    ? {
        swLat: Math.round(bounds.swLat * 1000) / 1000,
        swLng: Math.round(bounds.swLng * 1000) / 1000,
        neLat: Math.round(bounds.neLat * 1000) / 1000,
        neLng: Math.round(bounds.neLng * 1000) / 1000,
      }
    : null;
  return useQuery({
    queryKey: ['shops', 'pins', key],
    queryFn: () => getShopPins(bounds!),
    enabled: bounds != null,
    staleTime: 60_000,
    placeholderData: keepPreviousData, // 팬 중 핀이 깜빡이지 않게 이전 핀 유지
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
