import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { useMyLocationStore } from '@/shared/lib/myLocation.store';
import { useBottomInset } from '@/shared/lib/safeArea';
import { useAuthStore } from '@/shared/domain/auth/auth.store';
import {
  useFavorites,
  useFavoriteShopIds,
  useToggleFavorite,
} from '@/shared/domain/favorite/favorite.queries';
import type { Favorite } from '@/shared/domain/favorite/favorite.types';
import { getShop } from '@/shared/domain/shops/shops.api';
import type { ShopDetail } from '@/shared/domain/shops/shops.types';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';
import { LoginRequired } from '@/shared/ui/loginGate';
import { ShopListCard, type ShopCardInfo } from '@/shared/ui/ShopListCard';

import { locationLabelOf, todayOpenTimes } from '@/screens/home/shopToView';

import { CategoryChips, type FavoriteCategory } from './components/CategoryChips';
import { FavoriteEmpty } from './components/FavoriteEmpty';

// 상세(ShopDetail) → 카드 정보. 홈 카드와 같은 규칙(동네·거리·예약 가능 시각)을 공유한다.
// 시안의 "320m 전농동"처럼 위치 동의 시 내 위치 기준 거리도 보인다(전역 스토어 값).
function detailToCard(
  detail: ShopDetail,
  favorite: boolean,
  myLocation: { lat: number; lng: number } | null,
): ShopCardInfo {
  return {
    name: detail.name,
    dealLabel: detail.eventDesc,
    priceTier: detail.priceTier && detail.priceTier !== '미정' ? detail.priceTier : null,
    locationLabel: locationLabelOf(detail, myLocation),
    todayTimes: todayOpenTimes(detail),
    previewReview: detail.reviews[0]?.body ?? detail.previewReview ?? null,
    favorite,
    photos: detail.photos,
    reviewCount: detail.reviewCount,
  };
}

// 즐겨찾기 목록 (design.pen lCEKa 목록 / nBj0c 빈 상태). 마이페이지 '즐겨찾기' 메뉴에서 진입.
// GET /favorites는 shopId·이름 스냅샷만 주므로(BE DB 분리 — docs/favorite.md) 카드의
// 사진·주소·배지·리뷰수·카테고리는 shopId별 GET /shops/:id 병렬 조회로 채운다(상세 화면과 캐시 공유).
// 별 해제 시 카드는 목록에 유지(별만 꺼짐, 재탭 복구 — 사용자 확정): 진입 시점 목록을 스냅샷으로
// 고정하고 별 상태만 라이브 캐시(useFavoriteShopIds)로 표시. 재진입 시 해제분이 빠진다.
export function FavoriteScreen() {
  const bottomInset = useBottomInset();
  const myLocation = useMyLocationStore((s) => s.coords);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;

  const favoritesQuery = useFavorites(isLoggedIn);
  const favoriteIds = useFavoriteShopIds(isLoggedIn);
  const toggleFavorite = useToggleFavorite();

  const [snapshot, setSnapshot] = useState<Favorite[] | null>(null);
  useEffect(() => {
    if (snapshot === null && favoritesQuery.data) setSnapshot(favoritesQuery.data.favorites);
  }, [favoritesQuery.data, snapshot]);

  const [category, setCategory] = useState<FavoriteCategory>('전체');

  // shopId별 상세 병렬 조회 — 쿼리키가 상세 화면(useShop)과 동일해 캐시 공유(카드 탭 시 즉시 표시).
  const detailQueries = useQueries({
    queries: (snapshot ?? []).map((f) => ({
      queryKey: ['shops', f.shopId],
      queryFn: () => getShop(f.shopId),
      enabled: isLoggedIn,
      staleTime: 60_000,
      retry: false,
    })),
  });

  // 스냅샷 순서(서버 created_at DESC) 유지. 상세 미도착/실패 샵은 favorite 스냅샷 폴백 카드.
  const items = useMemo(
    () =>
      (snapshot ?? []).map((f, i) => ({
        shopId: f.shopId,
        detail: detailQueries[i]?.data ?? null,
        card: detailQueries[i]?.data
          ? detailToCard(detailQueries[i].data, favoriteIds.has(f.shopId), myLocation)
          : ({
              // 상세 도착 전 임시 카드 — 즐겨찾기 스냅샷에 있는 이름/지역만 쓴다.
              name: f.shopName,
              dealLabel: null,
              priceTier: null,
              locationLabel: f.shopRegion ?? '',
              todayTimes: [],
              previewReview: null,
              favorite: favoriteIds.has(f.shopId),
              photos: [],
            } satisfies ShopCardInfo),
      })),
    [snapshot, detailQueries, favoriteIds, myLocation],
  );

  // 카테고리 필터: 상세의 categories 기준(미도착 샵은 '전체'에서만 노출).
  const filtered = useMemo(
    () =>
      category === '전체' ? items : items.filter((it) => it.detail?.categories.includes(category)),
    [items, category],
  );

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="즐겨찾기" />
      {!isLoggedIn ? (
        // 비회원 게이팅 — 알림 화면과 동일 정책(닫기 = 진입 전 화면, 로그인 = replace).
        <LoginRequired />
      ) : favoritesQuery.isError && snapshot === null ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="font-pretendard-medium" style={{ fontSize: 15, color: colors.text.subtle }}>
            즐겨찾기를 불러오지 못했어요
          </Text>
          <Pressable onPress={() => favoritesQuery.refetch()}>
            <Text
              className="font-pretendard-semibold"
              style={{ fontSize: 15, color: colors.primary[500] }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : snapshot === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      ) : snapshot.length === 0 ? (
        <FavoriteEmpty showHomeButton />
      ) : (
        <>
          <CategoryChips active={category} onSelect={setCategory} />
          {filtered.length === 0 ? (
            <FavoriteEmpty showHomeButton={false} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.shopId}
              contentContainerStyle={{ paddingBottom: bottomInset + 12 }}
              renderItem={({ item }) => (
                <ShopListCard
                  variant="compact"
                  shop={item.card}
                  onPress={() => router.push(`/shop/${item.shopId}`)}
                  onToggleFavorite={() => toggleFavorite(item.shopId)}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}
