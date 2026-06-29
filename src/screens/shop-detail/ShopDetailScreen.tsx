import { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilitySection } from './components/AvailabilitySection';
import { DetailHeader } from './components/DetailHeader';
import { ImageCarousel } from './components/ImageCarousel';
import { InfoSection } from './components/InfoSection';
import { MenuSection } from './components/MenuSection';
import { ReservationBar } from './components/ReservationBar';
import { ReviewSection } from './components/ReviewSection';
import { SectionTabs, type TabKey } from './components/SectionTabs';
import { ShopTitleBlock } from './components/ShopTitleBlock';
import { getShopDetail } from './mockShopDetail';

type Props = {
  shopId?: string;
};

// 스크롤스파이 대상 섹션 (홈은 맨 위 = offset 0). 탭 순서와 동일.
const SPY_SECTIONS: TabKey[] = ['availability', 'menu', 'info', 'review'];

// 샵 상세페이지. Phase 1: mock 데이터. 탭 = 스크롤스파이 + sticky.
export function ShopDetailScreen({ shopId }: Props) {
  const insets = useSafeAreaInsets();
  const shop = getShopDetail(shopId);

  const [favorite, setFavorite] = useState(shop.favorite);
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
          <ImageCarousel count={shop.imageCount} />
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

      <ReservationBar phone={shop.phone} />
    </View>
  );
}
