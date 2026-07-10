import { useEffect, type ReactElement, type ReactNode } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { View } from 'react-native';

import { AvailabilitySection } from './components/AvailabilitySection';
import { ImageCarousel } from './components/ImageCarousel';
import { InfoSection } from './components/InfoSection';
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

// 상세 본문(타이틀·캐러셀·sticky 탭·섹션 4개) — 라우트 화면과 홈 포커스 시트가 공유.
export function ShopDetailBody({ shop, renderScroll, favorite, onToggleFavorite }: Props) {
  const spy = useSectionSpy();

  // 홈 시트에서 다른 핀 탭으로 샵이 바뀌면 이전 스크롤 위치·활성 탭이 남지 않게 초기화.
  useEffect(() => {
    spy.reset();
  }, [shop.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const children: ReactNode[] = [
    // index 0: 홈 영역 (타이틀 + 캐러셀)
    <View key="home" className="gap-5 pt-4">
      <ShopTitleBlock shop={shop} favorite={favorite} onToggleFavorite={onToggleFavorite} />
      <ImageCarousel photos={shop.photos} />
    </View>,
    // index 1: sticky 탭바
    <View key="tabs" onLayout={spy.onTabBarLayout}>
      <SectionTabs active={spy.activeTab} onPressTab={spy.onPressTab} />
    </View>,
    // index 2~5: 섹션 (각 onLayout으로 스크롤 오프셋 수집)
    <View key="availability" className="px-5 pt-7" onLayout={spy.onSectionLayout('availability')}>
      <AvailabilitySection availability={shop.availability} />
    </View>,
    <View key="menu" className="px-5 pt-8" onLayout={spy.onSectionLayout('menu')}>
      <MenuSection menus={shop.menus} />
    </View>,
    <View key="info" className="px-5 pt-8" onLayout={spy.onSectionLayout('info')}>
      <InfoSection info={shop.info} />
    </View>,
    <View key="review" className="px-5 pt-8" onLayout={spy.onSectionLayout('review')}>
      <ReviewSection reviewCount={shop.reviewCount} reviews={shop.reviews} />
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
