import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentLocationButton } from './components/CurrentLocationButton';
import { HomeHeader } from './components/HomeHeader';
import { MapPlaceholder } from './components/MapPlaceholder';
import { SearchBar } from './components/SearchBar';
import { ShopBottomSheet } from './components/ShopBottomSheet';
import { MOCK_SHOPS } from './mockShops';
import { useHomeFilterStore } from './useHomeFilterStore';

// 홈(지도뷰). Phase 1: 지도는 placeholder, mock 데이터. 필터는 단일 바텀시트 내용 전환.
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [shops, setShops] = useState(MOCK_SHOPS);
  const search = useHomeFilterStore((s) => s.search);
  const price = useHomeFilterStore((s) => s.price);
  const reset = useHomeFilterStore((s) => s.reset);

  const filtered = useMemo(
    () =>
      shops.filter(
        (s) =>
          (search === '' || s.name.includes(search)) &&
          (price === 'all' || String(s.priceTier) === price),
      ),
    [shops, search, price],
  );

  const toggleFavorite = (id: string) =>
    setShops((prev) => prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)));

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-white">
        <MapPlaceholder />

        {/* 상단 핑크 그라데이션 */}
        <LinearGradient
          colors={['#c24a6b33', '#c24a6b00']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 150 }}
        />

        {/* 헤더 + 검색 */}
        <View style={{ paddingTop: insets.top + 8 }}>
          <HomeHeader />
          <View className="px-5 pt-3">
            <SearchBar />
          </View>
        </View>

        {/* 현재위치 버튼 (지도 우하단, 바텀시트 위) */}
        <View className="absolute right-4" style={{ bottom: height * 0.42 + 12 }}>
          <CurrentLocationButton />
        </View>

        <ShopBottomSheet shops={filtered} onToggleFavorite={toggleFavorite} onReset={reset} />
      </View>
    </BottomSheetModalProvider>
  );
}
