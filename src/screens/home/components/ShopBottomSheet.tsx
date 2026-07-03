import BottomSheet, { BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/shared/theme/colors';

import type { ShopCardView } from '../shopToView';
import { useHomeFilterStore } from '../useHomeFilterStore';
import { FilterChipBar } from './FilterChipBar';
import { FilterView } from './filters/FilterView';
import { ShopListCard } from './ShopListCard';
import { ShopListEmpty } from './ShopListEmpty';
import { ShopListError } from './ShopListError';

type Props = {
  shops: ShopCardView[];
  selectedShop: ShopCardView | null; // 지도 핀 탭으로 선택된 매장 (미리보기)
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onToggleFavorite: (id: string) => void;
  onReset: () => void;
  onEndReached: () => void; // 리스트 끝 도달 → 다음 페이지 로드 (가드는 HomeScreen 담당)
  isFetchingNextPage: boolean;
};

// 단일 바텀시트: activeFilter → 필터 화면 / selectedShop → 매장 미리보기 1개 / 그 외 → 칩바+목록.
// 시트 위치는 사용자가 둔 그대로 유지 — 필터를 열거나 닫아도 스냅 이동하지 않는다.
// 단 미리보기는 지도가 보여야 하므로 핀 탭 시 40%로 내리고, 위로 크게 올리면(90%) 상세로 진입한다.
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
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const activeFilter = useHomeFilterStore((s) => s.activeFilter);
  const setActiveFilter = useHomeFilterStore((s) => s.setActiveFilter);

  const snapPoints = useMemo(() => ['40%', '90%'], []);

  // 핀 탭(선택 변경) 시 지도가 보이게 시트를 40%로.
  useEffect(() => {
    if (selectedShop) sheetRef.current?.snapToIndex(0);
  }, [selectedShop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = (id: string) => {
    // 상세에서 뒤로 왔을 때 시트가 90%로 남지 않게 먼저 내린다.
    sheetRef.current?.snapToIndex(0);
    router.push(`/shop/${id}`);
  };

  // 미리보기 상태에서 시트를 위로 크게 올리면(90% 도달) 상세로 진입.
  const handleChange = (index: number) => {
    if (selectedShop && index === 1) openDetail(selectedShop.id);
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleChange}
      handleIndicatorStyle={{ backgroundColor: '#d9d9d9', width: 40, height: 5 }}
      backgroundStyle={{
        borderTopLeftRadius: activeFilter ? 20 : 28,
        borderTopRightRadius: activeFilter ? 20 : 28,
      }}
    >
      {activeFilter ? (
        <FilterView filterKey={activeFilter} onClose={() => setActiveFilter(null)} />
      ) : selectedShop ? (
        <BottomSheetView>
          <FilterChipBar />
          <View style={{ paddingTop: 13 }}>
            <ShopListCard
              shop={selectedShop}
              onPress={() => openDetail(selectedShop.id)}
              onToggleFavorite={() => onToggleFavorite(selectedShop.id)}
            />
          </View>
        </BottomSheetView>
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
                  onPress={() => router.push(`/shop/${item.id}`)}
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
