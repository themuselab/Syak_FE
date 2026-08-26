import { RotateCcw } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { router } from 'expo-router';

import { track } from '@/shared/lib/analytics';
import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { useFavoriteShopIds, useToggleFavorite } from '@/shared/domain/favorite/favorite.queries';
import { postReservationClick } from '@/shared/domain/reservation/reservation.api';
import { useShopSlots } from '@/shared/domain/reservation/reservation.queries';
import { useShop } from '@/shared/domain/shops/shops.queries';
import { colors } from '@/shared/theme/colors';
import { LoginPromptModal } from '@/shared/ui/LoginPromptModal';

import { DetailHeader } from './components/DetailHeader';
import { ReservationBar } from './components/ReservationBar';
import { ShopDetailBody } from './ShopDetailBody';
import { toShopDetailView } from './shopDetailToView';

type Props = {
  shopId?: string;
};

// 샵 상세페이지(라우트 /shop/:id). GET /shops/:id + GET /slots/shop/:id(3일치) → 뷰모델 어댑터로 각 섹션에 공급.
// 본문(타이틀·캐러셀·sticky 탭·스크롤스파이·섹션)은 ShopDetailBody — 홈 포커스 시트와 공유.
// 즐겨찾기는 /favorites 서버 연동(홈과 단일 캐시) — 비회원은 LoginPromptModal 게이팅.
export function ShopDetailScreen({ shopId }: Props) {
  const shopQuery = useShop(shopId ?? '', !!shopId);
  const slotsQuery = useShopSlots(shopId ?? '', !!shopId);

  const shop = useMemo(
    () =>
      shopQuery.data ? toShopDetailView(shopQuery.data, slotsQuery.data?.slots ?? []) : null,
    [shopQuery.data, slotsQuery.data],
  );

  // GA4 shop_view: 샵 상세 진입 시 1회 (웹 detail_view→shop_view와 동일 이벤트, 통합 퍼널)
  useEffect(() => {
    if (shop?.id) track.shopView(shop.id, shop.name);
  }, [shop?.id, shop?.name]);

  // 즐겨찾기: 홈과 같은 ['favorites','list'] 캐시에서 파생 — 화면 간 자동 동기화.
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;
  const favoriteIds = useFavoriteShopIds(isLoggedIn);
  const favorite = shopId ? favoriteIds.has(shopId) : false;
  const toggleFavoriteOnServer = useToggleFavorite();
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const onToggleFavorite = () => {
    if (!shopId) return;
    if (!isLoggedIn) {
      setLoginModalVisible(true);
      return;
    }
    toggleFavoriteOnServer(shopId);
  };

  // 로딩 / 에러 (헤더는 유지해 뒤로가기 가능).
  if (!shop) {
    return (
      <View className="flex-1 bg-white">
        <DetailHeader favorite={favorite} onToggleFavorite={onToggleFavorite} />
        <LoginPromptModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          onPressLogin={() => {
            setLoginModalVisible(false);
            router.push('/login');
          }}
        />
        {shopQuery.isError ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Text className="text-body-m font-pretendard text-gray-600">
              샵 정보를 불러오지 못했어요
            </Text>
            <Pressable
              onPress={() => shopQuery.refetch()}
              className="items-center gap-1"
              hitSlop={8}
            >
              <RotateCcw size={20} color={colors.gray[700]} />
              <Text className="text-body-m font-pretendard text-gray-700">다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <DetailHeader favorite={favorite} onToggleFavorite={onToggleFavorite} />
      <LoginPromptModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onPressLogin={() => {
          setLoginModalVisible(false);
          router.push('/login');
        }}
      />

      <ShopDetailBody
        shop={shop}
        renderScroll={(scrollProps, ref) => (
          <ScrollView {...scrollProps} ref={ref} scrollEventThrottle={16} />
        )}
      />

      <ReservationBar
        phone={shop.phone}
        route={shop.bookingRoute}
        onReserveClick={() => {
          // 클릭 애널리틱스 — 실패해도 무시(fire-and-forget)
          postReservationClick(shop.id).catch(() => {});
          track.reserveClick(shop.id, shop.bookingRoute?.label); // GA4 (웹과 동일 이벤트)
        }}
      />
    </View>
  );
}
