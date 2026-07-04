import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { ApiError, ErrorCode } from '@/shared/api/errors';

import { addFavorite, getFavorites, removeFavorite } from './favorite.api';
import type { Favorite, FavoriteListResponse } from './favorite.types';

const FAVORITES_KEY = ['favorites', 'list'] as const;
const EMPTY_IDS = new Set<string>(); // 비회원/미로드 시 반환 — 참조 안정용 모듈 상수

// 낙관적 추가용 임시 항목. 이번 소비자는 shopId 대조뿐이라 나머지 빈 값 무해.
// (즐겨찾기 목록 화면 추가 시 onSuccess의 서버 응답 교체·invalidate가 진짜 값을 보장)
function optimisticFavorite(shopId: string): Favorite {
  return {
    id: `optimistic-${shopId}`,
    userId: '',
    shopId,
    shopName: '',
    shopRegion: null,
    createdAt: new Date().toISOString(),
  };
}

// 즐겨찾기 샵 ID Set. 인증 필요 — 호출부에서 로그인 여부를 enabled로 전달.
// 비회원일 땐 잔존 캐시가 있어도 항상 빈 Set (로그아웃 직후 이전 계정 별 노출 방지).
// select 결과는 react-query가 메모하므로 참조 안정 — useMemo deps에 그대로 사용 가능.
export function useFavoriteShopIds(enabled: boolean): Set<string> {
  const { data } = useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: getFavorites,
    enabled,
    select: (d) => new Set(d.favorites.map((f) => f.shopId)),
    staleTime: 60_000,
  });
  return enabled ? (data ?? EMPTY_IDS) : EMPTY_IDS;
}

// 별 토글. 낙관적 업데이트(BE 문서 04-favorite.md 권장) — 탭 즉시 반영, 실패 시 해당 샵만 역연산 롤백.
// 방향은 호출 시점의 낙관 캐시 기준이라 홈/상세 어디서 눌러도 일관.
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set()); // 같은 샵 연타 가드 (in-flight 중 무시)

  const mutation = useMutation({
    mutationFn: ({ shopId, next }: { shopId: string; next: boolean }): Promise<Favorite | void> =>
      next ? addFavorite(shopId) : removeFavorite(shopId),

    onMutate: async ({ shopId, next }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const prev = queryClient.getQueryData<FavoriteListResponse>(FAVORITES_KEY);
      const removed = prev?.favorites.find((f) => f.shopId === shopId) ?? null;
      queryClient.setQueryData<FavoriteListResponse>(FAVORITES_KEY, (old) => {
        const favorites = old?.favorites ?? [];
        return next
          ? { favorites: [optimisticFavorite(shopId), ...favorites] } // created_at DESC → 맨 앞
          : { favorites: favorites.filter((f) => f.shopId !== shopId) };
      });
      return { removed }; // remove 실패 시 복원용
    },

    onSuccess: (data, { shopId, next }) => {
      // add 성공: 임시 항목을 서버 응답(진짜 id·shopName·createdAt)으로 교체 — invalidate 불필요.
      if (next && data) {
        queryClient.setQueryData<FavoriteListResponse>(FAVORITES_KEY, (old) => ({
          favorites: (old?.favorites ?? []).map((f) => (f.shopId === shopId ? data : f)),
        }));
      }
    },

    onError: (error, { shopId, next }, ctx) => {
      // 409(이미 있음)/404(이미 없음) = 서버가 이미 원하는 상태 — 성공 취급(롤백 안 함).
      // 낙관 임시 항목의 진짜 값 확보를 위해 재동기화만 1회.
      if (
        error instanceof ApiError &&
        (error.code === ErrorCode.FAVORITE_ALREADY_EXISTS ||
          error.code === ErrorCode.FAVORITE_NOT_FOUND)
      ) {
        queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
        return;
      }
      // 그 외(SHOP_NOT_FOUND·네트워크 등): 해당 샵만 역연산 롤백.
      // 전체 스냅샷 복원은 다른 샵의 동시 낙관 반영을 덮어써서 금지.
      // 실패 안내 UI는 토스트 인프라 부재로 생략(조용히 원복) — docs/home.md 임시 동작 참조.
      queryClient.setQueryData<FavoriteListResponse>(FAVORITES_KEY, (old) => {
        const favorites = old?.favorites ?? [];
        if (next) return { favorites: favorites.filter((f) => f.shopId !== shopId) };
        return ctx?.removed ? { favorites: [ctx.removed, ...favorites] } : { favorites };
      });
    },

    onSettled: (_data, _error, { shopId }) => {
      pendingRef.current.delete(shopId);
    },
  });

  return (shopId: string) => {
    if (pendingRef.current.has(shopId)) return;
    const cur = queryClient.getQueryData<FavoriteListResponse>(FAVORITES_KEY);
    const isFav = cur?.favorites.some((f) => f.shopId === shopId) ?? false;
    pendingRef.current.add(shopId);
    mutation.mutate({ shopId, next: !isFav });
  };
}
