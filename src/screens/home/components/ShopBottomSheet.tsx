import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShopDetailSheet } from '@/screens/shop-detail/ShopDetailSheet';
import { colors } from '@/shared/theme/colors';
import { ShopListCard } from '@/shared/ui/ShopListCard';

import type { ShopCardView } from '../shopToView';
import { useHomeFilterStore } from '../useHomeFilterStore';
import { FilterChipBar } from './FilterChipBar';
import { FilterView } from './filters/FilterView';
import { ShopListEmpty } from './ShopListEmpty';
import { ShopListError } from './ShopListError';

type Props = {
  shops: ShopCardView[];
  selectedShop: ShopCardView | null; // 핀/카드 탭으로 포커스된 매장 (인라인 상세)
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onToggleFavorite: (id: string) => void;
  onReset: () => void;
  onEndReached: () => void; // 리스트 끝 도달 → 다음 페이지 로드 (가드는 HomeScreen 담당)
  isFetchingNextPage: boolean;
  onSelectShop: (id: string) => void; // 목록 카드 탭 → 핀과 동일한 포커스 플로우
  onDeselect: () => void; // 물리 뒤로가기 등에서 포커스 해제
  topOffset: number; // 헤더+검색바 오버레이 높이 — 목록 모드 최대 확장이 검색바를 가리지 않게 (QA #50)
};

// 단일 바텀시트: activeFilter → 필터 화면 / selectedShop → 인라인 상세(특정샵 포커스) / 그 외 → 칩바+목록.
// 시트 위치는 사용자가 둔 그대로 유지 — 필터를 열거나 닫아도 스냅 이동하지 않는다.
// 포커스 모드는 지도가 보이는 35%로 내리고, 위로 올리면(100%) 라우트 이동 없이 시트 안에서
// 상세 전체(헤더·sticky 탭·예약바)가 화면을 덮는다 — 사용자 확정(2026-07-10 피드백).
export function ShopBottomSheet({
  shops,
  selectedShop,
  isLoading,
  isError,
  onRetry,
  onToggleFavorite,
  onReset,
  onEndReached,
  isFetchingNextPage,
  onSelectShop,
  onDeselect,
  topOffset,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<BottomSheet>(null);
  const activeFilter = useHomeFilterStore((s) => s.activeFilter);
  const setActiveFilter = useHomeFilterStore((s) => s.setActiveFilter);

  const focused = selectedShop != null;
  // 포커스 접힘 높이는 디자인 285/812 ≈ 35%(euK3A), 확장은 100% 풀스크린(의도된 동작).
  // 목록 모드 최대 확장은 검색바 바로 아래까지만(QA #50) — 측정 전(topOffset 0)엔 기존 90% 폴백.
  const snapPoints = useMemo(() => {
    if (focused) return ['35%', '100%'];
    return ['40%', topOffset > 0 ? windowHeight - topOffset - 8 : '90%'];
  }, [focused, topOffset, windowHeight]);

  // 풀스크린 여부. onChange(settle 시점) 기준 — 확장 중 애니메이션 동안은 접힘 취급.
  const [expanded, setExpanded] = useState(false);

  // 핀/카드 탭(선택 변경) 시 지도가 보이게 시트를 35%로 + 확장 상태 초기화.
  useEffect(() => {
    setExpanded(false);
    if (selectedShop) sheetRef.current?.snapToIndex(0);
  }, [selectedShop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (index: number) => {
    if (focused) setExpanded(index === 1);
  };

  // 안드 물리 뒤로가기: 풀스크린 → 접힘(35%), 접힘 포커스 → 선택 해제. 그 외 기본 동작.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!focused) return false;
      if (expanded) {
        sheetRef.current?.snapToIndex(0);
        return true;
      }
      onDeselect();
      return true;
    });
    return () => sub.remove();
  }, [focused, expanded, onDeselect]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      // v5 기본값(true)이면 콘텐츠 높이 스냅포인트가 추가돼, 칩 토글로 목록이 로딩 스피너로
      // 교체되는 순간 시트가 최소 높이로 줄어든다(QA #53) — 지정 스냅포인트만 사용.
      enableDynamicSizing={false}
      onChange={handleChange}
      // 풀스크린에선 핸들을 숨기고 라운드를 없애 라우트 상세 화면과 동일하게 보이게.
      handleComponent={expanded ? null : undefined}
      handleIndicatorStyle={{ backgroundColor: '#d9d9d9', width: 40, height: 5 }}
      backgroundStyle={{
        borderTopLeftRadius: expanded ? 0 : activeFilter ? 20 : 28,
        borderTopRightRadius: expanded ? 0 : activeFilter ? 20 : 28,
      }}
    >
      {activeFilter ? (
        <FilterView filterKey={activeFilter} onClose={() => setActiveFilter(null)} />
      ) : selectedShop ? (
        <ShopDetailSheet
          shopId={selectedShop.id}
          favorite={selectedShop.favorite}
          onToggleFavorite={() => onToggleFavorite(selectedShop.id)}
          expanded={expanded}
          onCollapse={() => sheetRef.current?.snapToIndex(0)}
        />
      ) : (
        <>
          <FilterChipBar />
          {isLoading ? (
            <View className="items-center justify-center pt-16">
              <ActivityIndicator color={colors.primary[500]} />
            </View>
          ) : isError ? (
            <ShopListError onRetry={onRetry} />
          ) : shops.length === 0 ? (
            <ShopListEmpty onReset={onReset} />
          ) : (
            <BottomSheetFlatList
              data={shops}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingTop: 13, paddingBottom: insets.bottom + 12 }}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={{ paddingVertical: 16 }}>
                    <ActivityIndicator color={colors.primary[500]} />
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <ShopListCard
                  shop={item}
                  onPress={() => onSelectShop(item.id)}
                  onToggleFavorite={() => onToggleFavorite(item.id)}
                />
              )}
            />
          )}
        </>
      )}
    </BottomSheet>
  );
}
