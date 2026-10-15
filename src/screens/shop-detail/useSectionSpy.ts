import { useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TabKey } from './components/SectionTabs';

// 스크롤스파이 대상 섹션 (홈은 맨 위 = offset 0). 탭 순서와 동일.
// 홈(탭 바로 아래 정보 영역)은 맨 위 기준이라 목록에 없다. 순서는 화면 순서와 같다.
const SPY_SECTIONS: TabKey[] = ['menu', 'availability', 'review'];

// 스크롤 컨테이너가 라우트(ScrollView)와 홈 시트(BottomSheetScrollView)로 달라
// 인스턴스 타입 대신 구조적 타입으로 받는다 — 둘 다 이 시그니처의 scrollTo를 가진다.
export type SectionScrollHandle = {
  scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
};

// 상세 본문 공용 스크롤스파이: 섹션 onLayout으로 오프셋 수집 → onScroll로 활성 탭 계산,
// 탭 탭 시 scrollTo 점프. 마지막 섹션이 탭바 바로 아래까지 올라오도록 하단 여백(bottomPad) 동적 계산.
export function useSectionSpy() {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  // 마지막 섹션도 탭바 바로 아래로 스크롤될 수 있도록 하단 여백을 동적으로 계산.
  const [viewportH, setViewportH] = useState(0);
  const [lastSectionH, setLastSectionH] = useState(0);

  const scrollRef = useRef<SectionScrollHandle | null>(null);
  const offsets = useRef<Partial<Record<TabKey, number>>>({});
  const tabBarHeight = useRef(41);

  const onSectionLayout = (key: TabKey) => (e: LayoutChangeEvent) => {
    offsets.current[key] = e.nativeEvent.layout.y;
    if (key === 'review') setLastSectionH(e.nativeEvent.layout.height);
  };

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    tabBarHeight.current = e.nativeEvent.layout.height;
  };

  const onViewportLayout = (e: LayoutChangeEvent) => setViewportH(e.nativeEvent.layout.height);

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
    // 섹션 맨 위엔 회색 띠(8)와 위 여백(24)이 있어서, 제목이 탭바 바로 아래 와도 섹션 시작점은
    // 아직 탭바보다 아래다. 그 여백만큼 일찍 활성 탭을 바꿔야 "보이는 제목 = 활성 탭"이 맞는다.
    const SECTION_LEAD = 32;
    const y = e.nativeEvent.contentOffset.y + tabBarHeight.current + SECTION_LEAD;
    let next: TabKey = 'home';
    for (const key of SPY_SECTIONS) {
      const top = offsets.current[key];
      if (top !== undefined && y >= top) next = key;
    }
    if (next !== activeTab) setActiveTab(next);
  };

  // 표시 샵이 바뀔 때(홈 시트에서 다른 핀 탭) 스크롤·활성 탭 초기화.
  const reset = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setActiveTab('home');
  };

  return {
    activeTab,
    bottomPad,
    scrollRef,
    onSectionLayout,
    onTabBarLayout,
    onViewportLayout,
    onPressTab,
    onScroll,
    reset,
  };
}
