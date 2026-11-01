import { RotateCcw } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { track } from '@/shared/lib/analytics';
import { useFavoriteShopIds, useToggleFavorite } from '@/shared/domain/favorite/favorite.queries';
import { useMarkShopNotificationsRead } from '@/shared/domain/notification/notification.queries';
import { postReservationClick } from '@/shared/domain/reservation/reservation.api';
import { useShopSlots } from '@/shared/domain/reservation/reservation.queries';
import { useShop } from '@/shared/domain/shops/shops.queries';
import { useMyLocationStore } from '@/shared/lib/myLocation.store';
import { colors } from '@/shared/theme/colors';
import { useLoginGate } from '@/shared/ui/loginGate';
import { useSlotAlertSheet } from '@/shared/ui/slot-alert/useSlotAlertSheet';

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
  const myLocation = useMyLocationStore((s) => s.coords);
  const insets = useSafeAreaInsets();
  // 빈자리 알림 시트 + 완료 토스트. 토스트는 하단 예약 바(약 72px) 위에 띄운다.
  const slotAlert = useSlotAlertSheet({ toastBottom: insets.bottom + 84 });
  const shopQuery = useShop(shopId ?? '', !!shopId);
  const slotsQuery = useShopSlots(shopId ?? '', !!shopId);

  const shop = useMemo(
    () =>
      shopQuery.data ? toShopDetailView(shopQuery.data, slotsQuery.data?.slots ?? [], myLocation) : null,
    [shopQuery.data, slotsQuery.data, myLocation],
  );

  // GA4 shop_view: 샵 상세 라우트 진입 시 샵 id당 1회(데이터 도착 후 — category·구(region)를 실어야 해서).
  // 진입 경로(source)는 이동 직전 호출부가 markShopSource로 적어 둔다(없으면 'direct'). 웹과 같은 이벤트.
  const detail = shopQuery.data;
  useEffect(() => {
    if (!detail) return;
    track.shopView({
      shopId: detail.id,
      category: detail.categories[0] ?? null,
      region: detail.district,
      fallbackSource: 'direct',
    });
  }, [detail?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- 샵이 바뀔 때만

  // 즐겨찾기: 홈과 같은 ['favorites','list'] 캐시에서 파생 — 화면 간 자동 동기화.
  const { isLoggedIn, requireLogin, loginModal } = useLoginGate();
  const favoriteIds = useFavoriteShopIds(isLoggedIn);
  const favorite = shopId ? favoriteIds.has(shopId) : false;
  const toggleFavoriteOnServer = useToggleFavorite();
  // 푸시·알림 목록에서 이 샵으로 들어오면 이 샵 알림은 읽은 것으로
  useMarkShopNotificationsRead(shopId, isLoggedIn);

  const onToggleFavorite = () => {
    if (!shopId) return;
    requireLogin(() => toggleFavoriteOnServer(shopId));
  };

  // 로딩 / 에러 (헤더는 유지해 뒤로가기 가능).
  if (!shop) {
    return (
      <View className="flex-1 bg-white">
        <DetailHeader favorite={favorite} onToggleFavorite={onToggleFavorite} />
        {loginModal}
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
      {loginModal}

      <ShopDetailBody
        shop={shop}
        slotsReady={!slotsQuery.isPending}
        renderScroll={(scrollProps, ref) => (
          <ScrollView {...scrollProps} ref={ref} scrollEventThrottle={16} />
        )}
        onOpenSlotAlert={(dayIndex) => shopId && slotAlert.open(shopId, dayIndex)}
      />

      <ReservationBar
        instagram={shop.instagram}
        phone={shop.phone}
        route={shop.bookingRoute}
        onReserveClick={(method) => {
          // 클릭 애널리틱스 — 실패해도 무시(fire-and-forget). 서버 집계는 기존대로 온라인 예약 버튼만.
          if (method !== 'phone') postReservationClick(shop.id).catch(() => {});
          // GA4 reserve_click (웹과 동일 이벤트) — 누를 때마다 1회. 버튼이 특정 시각을 고른 상태가 아니라 slot_date/time 없음.
          track.reserveClick({ shopId: shop.id, method });
        }}
      />
      {slotAlert.element}
    </View>
  );
}
