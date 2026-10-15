import { useEffect, type ReactElement, type ReactNode } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import { AvailabilitySection } from './components/AvailabilitySection';
import { HomeInfoSection } from './components/HomeInfoSection';
import { ImageCarousel } from './components/ImageCarousel';
import { MenuSection } from './components/MenuSection';
import { ReviewSection } from './components/ReviewSection';
import { SectionTabs } from './components/SectionTabs';
import { ShopTitleBlock } from './components/ShopTitleBlock';
import type { ShopDetailView } from './shopDetailToView';
import { type SectionScrollHandle, useSectionSpy } from './useSectionSpy';

// 스크롤 컨테이너에 그대로 스프레드할 props. stickyHeaderIndices는 children이
// 컨테이너 "직계" 배열이어야 동작하므로(프래그먼트 래핑 금지) 본문이 children까지 만들어 넘긴다.
export type DetailScrollProps = {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onLayout: (e: LayoutChangeEvent) => void;
  showsVerticalScrollIndicator: boolean;
  stickyHeaderIndices: number[];
  contentContainerStyle: { paddingBottom: number };
  children: ReactNode[];
};

type Props = {
  shop: ShopDetailView;
  // 스크롤 컨테이너 주입: 라우트 화면=RN ScrollView, 홈 시트=BottomSheetScrollView.
  // (scrollEventThrottle은 gorhom이 내부 관리라 라우트 쪽에서만 지정)
  renderScroll: (
    props: DetailScrollProps,
    ref: (node: SectionScrollHandle | null) => void,
  ) => ReactElement;
  // 35% 포커스 시트 디자인의 타이틀 행 별 — 홈 시트에서만 전달(라우트 화면은 헤더 별 사용).
  favorite?: boolean;
  onToggleFavorite?: () => void;
};

// 상세 본문 — 라우트 화면과 홈 포커스 시트가 공유.
export function ShopDetailBody({ shop, renderScroll, favorite, onToggleFavorite }: Props) {
  const spy = useSectionSpy();

  // 홈 시트에서 다른 핀 탭으로 샵이 바뀌면 이전 스크롤 위치·활성 탭이 남지 않게 초기화.
  useEffect(() => {
    spy.reset();
  }, [shop.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 섹션 사이 굵은 회색 띠(시안). 띠를 섹션 안쪽 맨 위에 둬서 탭으로 점프하면 띠부터 보인다.
  const band = <View style={{ height: 8, backgroundColor: colors.surface.muted }} />;

  // 순서(디자이너 시안 2026-10-15): 제목·사진 → 탭 → 홈(이벤트·정보·소개) → 가격 → 빈자리 → 리뷰.
  const children: ReactNode[] = [
    // index 0: 제목 + 사진
    <View key="top" className="gap-5 pt-4 pb-5">
      <ShopTitleBlock shop={shop} favorite={favorite} onToggleFavorite={onToggleFavorite} />
      <ImageCarousel photos={shop.photos} />
    </View>,
    // index 1: sticky 탭바
    <View key="tabs" onLayout={spy.onTabBarLayout}>
      <SectionTabs active={spy.activeTab} onPressTab={spy.onPressTab} />
    </View>,
    // index 2: 홈 영역 — 탭 바로 아래라 "홈" 탭(맨 위)에 속한다
    <View key="home" className="pb-6">
      <HomeInfoSection shop={shop} />
    </View>,
    // index 3~5: 스크롤스파이 섹션 (각 onLayout으로 스크롤 오프셋 수집)
    <View key="menu" onLayout={spy.onSectionLayout('menu')}>
      {band}
      <View className="px-5 pb-6 pt-6">
        <MenuSection menus={shop.menus} />
      </View>
    </View>,
    <View key="availability" onLayout={spy.onSectionLayout('availability')}>
      {band}
      <View className="px-5 pb-6 pt-6">
        <AvailabilitySection timeline={shop.timeline} />
      </View>
    </View>,
    <View key="review" onLayout={spy.onSectionLayout('review')}>
      {band}
      <View className="px-5 pt-6">
        <ReviewSection reviewCount={shop.reviewCount} reviews={shop.reviews} />
      </View>
    </View>,
  ];


  return renderScroll(
    {
      onScroll: spy.onScroll,
      onLayout: spy.onViewportLayout,
      showsVerticalScrollIndicator: false,
      stickyHeaderIndices: [1],
      contentContainerStyle: { paddingBottom: spy.bottomPad },
      children,
    },
    (node) => {
      spy.scrollRef.current = node;
    },
  );
}
