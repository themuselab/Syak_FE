import { RotateCcw } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { postReservationClick } from '@/shared/domain/reservation/reservation.api';
import { useShopSlots } from '@/shared/domain/reservation/reservation.queries';
import { useShop } from '@/shared/domain/shops/shops.queries';
import { colors } from '@/shared/theme/colors';

import { AvailabilitySection } from './components/AvailabilitySection';
import { DetailHeader } from './components/DetailHeader';
import { ImageCarousel } from './components/ImageCarousel';
import { InfoSection } from './components/InfoSection';
import { MenuSection } from './components/MenuSection';
import { ReservationBar } from './components/ReservationBar';
import { ReviewSection } from './components/ReviewSection';
import { SectionTabs, type TabKey } from './components/SectionTabs';
import { ShopTitleBlock } from './components/ShopTitleBlock';
import { toShopDetailView } from './shopDetailToView';

type Props = {
  shopId?: string;
};

// 스크롤스파이 대상 섹션 (홈은 맨 위 = offset 0). 탭 순서와 동일.
const SPY_SECTIONS: TabKey[] = ['availability', 'menu', 'info', 'review'];

// 샵 상세페이지. GET /shops/:id + GET /slots/shop/:id(3일치) → 뷰모델 어댑터로 각 섹션에 공급.
// 탭 = 스크롤스파이 + sticky. 즐겨찾기는 1차 로컬(즐겨찾기 API는 로그인 연동 후).
export function ShopDetailScreen({ shopId }: Props) {
  const insets = useSafeAreaInsets();

  const shopQuery = useShop(shopId ?? '', !!shopId);
  const slotsQuery = useShopSlots(shopId ?? '', !!shopId);

  const shop = useMemo(
    () =>
      shopQuery.data ? toShopDetailView(shopQuery.data, slotsQuery.data?.slots ?? []) : null,
    [shopQuery.data, slotsQuery.data],
  );

  const [favorite, setFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  // 마지막 섹션도 탭바 바로 아래로 스크롤될 수 있도록 하단 여백을 동적으로 계산.
  const [viewportH, setViewportH] = useState(0);
  const [lastSectionH, setLastSectionH] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<TabKey, number>>>({});
  const tabBarHeight = useRef(41);

  const onSectionLayout = (key: TabKey) => (e: LayoutChangeEvent) => {
    offsets.current[key] = e.nativeEvent.layout.y;
    if (key === 'review') setLastSectionH(e.nativeEvent.layout.height);
  };

  // 마지막 섹션(리뷰)이 탭바 바로 아래까지 올라올 만큼의 스크롤 여유를 확보.
  const bottomPad = Math.max(
    insets.bottom + 96,
    viewportH - tabBarHeight.current - lastSectionH + insets.bottom + 24,
  );

  const onPressTab = (key: TabKey) => {
    setActiveTab(key);
    if (key === 'home') {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const y = offsets.current[key];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: y - tabBarHeight.current, animated: true });
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + tabBarHeight.current + 1;
    let next: TabKey = 'home';
    for (const key of SPY_SECTIONS) {
      const top = offsets.current[key];
      if (top !== undefined && y >= top) next = key;
    }
    if (next !== activeTab) setActiveTab(next);
  };

  // 로딩 / 에러 (헤더는 유지해 뒤로가기 가능).
  if (!shop) {
    return (
      <View className="flex-1 bg-white">
        <DetailHeader favorite={favorite} onToggleFavorite={() => setFavorite((v) => !v)} />
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
      <DetailHeader favorite={favorite} onToggleFavorite={() => setFavorite((v) => !v)} />

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        {/* index 0: 홈 영역 (타이틀 + 캐러셀) */}
        <View className="gap-5 pt-4">
          <ShopTitleBlock shop={shop} />
          <ImageCarousel photos={shop.photos} />
        </View>

        {/* index 1: sticky 탭바 */}
        <View onLayout={(e) => (tabBarHeight.current = e.nativeEvent.layout.height)}>
          <SectionTabs active={activeTab} onPressTab={onPressTab} />
        </View>

        {/* index 2~5: 섹션 (각 onLayout으로 스크롤 오프셋 수집) */}
        <View className="px-5 pt-7" onLayout={onSectionLayout('availability')}>
          <AvailabilitySection availability={shop.availability} />
        </View>
        <View className="px-5 pt-8" onLayout={onSectionLayout('menu')}>
          <MenuSection menus={shop.menus} />
        </View>
        <View className="px-5 pt-8" onLayout={onSectionLayout('info')}>
          <InfoSection info={shop.info} />
        </View>
        <View className="px-5 pt-8" onLayout={onSectionLayout('review')}>
          <ReviewSection reviewCount={shop.reviewCount} reviews={shop.reviews} />
        </View>
      </ScrollView>

      <ReservationBar
        phone={shop.phone}
        bookingUrl={shop.bookingUrl}
        onReserveClick={() => {
          // 클릭 애널리틱스 — 실패해도 무시(fire-and-forget)
          postReservationClick(shop.id).catch(() => {});
        }}
      />
    </View>
  );
}
