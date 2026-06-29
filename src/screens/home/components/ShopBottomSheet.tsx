import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useMemo } from 'react';

import type { Shop } from '../mockShops';
import { useHomeFilterStore } from '../useHomeFilterStore';
import { FilterChipBar } from './FilterChipBar';
import { FilterView } from './filters/FilterView';
import { ShopListCard } from './ShopListCard';
import { ShopListEmpty } from './ShopListEmpty';

type Props = {
  shops: Shop[];
  onToggleFavorite: (id: string) => void;
  onReset: () => void;
};

// 단일 바텀시트: activeFilter 없으면 칩바+목록, 있으면 필터 화면으로 내용 전환.
// 시트 위치는 사용자가 둔 그대로 유지 — 필터를 열거나 닫아도 스냅 이동(아래로 내려감)하지 않는다.
export function ShopBottomSheet({ shops, onToggleFavorite, onReset }: Props) {
  const activeFilter = useHomeFilterStore((s) => s.activeFilter);
  const setActiveFilter = useHomeFilterStore((s) => s.setActiveFilter);

  const snapPoints = useMemo(() => ['40%', '90%'], []);

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      handleIndicatorStyle={{ backgroundColor: '#d9d9d9', width: 40, height: 5 }}
      backgroundStyle={{
        borderTopLeftRadius: activeFilter ? 20 : 28,
        borderTopRightRadius: activeFilter ? 20 : 28,
      }}
    >
      {activeFilter ? (
        <FilterView filterKey={activeFilter} onClose={() => setActiveFilter(null)} />
      ) : (
        <>
          <FilterChipBar />
          {shops.length === 0 ? (
            <ShopListEmpty onReset={onReset} />
          ) : (
            <BottomSheetFlatList
              data={shops}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingTop: 13 }}
              renderItem={({ item }) => (
                <ShopListCard shop={item} onToggleFavorite={() => onToggleFavorite(item.id)} />
              )}
            />
          )}
        </>
      )}
    </BottomSheet>
  );
}
