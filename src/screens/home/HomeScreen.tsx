import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useShops } from '@/shared/domain/shops/shops.queries';

import { CurrentLocationButton } from './components/CurrentLocationButton';
import { HomeHeader } from './components/HomeHeader';
import { HomeMap, type HomeMapRef } from './components/HomeMap';
import { SearchBar } from './components/SearchBar';
import { ShopBottomSheet } from './components/ShopBottomSheet';
import { filtersToParams } from './filtersToParams';
import { toShopCardView } from './shopToView';
import { useHomeFilterStore } from './useHomeFilterStore';

// 홈(지도뷰). 지도는 placeholder(Phase B에서 네이버지도). 데이터는 GET /shops(비회원 가능).
// 서버 필터는 filtersToParams로, 이름검색·price_desc는 받은 목록에 클라 후처리. 즐겨찾기는 1차 로컬.
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const mapRef = useRef<HomeMapRef>(null);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());

  const sort = useHomeFilterStore((s) => s.sort);
  const regions = useHomeFilterStore((s) => s.regions);
  const price = useHomeFilterStore((s) => s.price);
  const serviceFields = useHomeFilterStore((s) => s.serviceFields);
  const toggles = useHomeFilterStore((s) => s.toggles);
  const search = useHomeFilterStore((s) => s.search);
  const reset = useHomeFilterStore((s) => s.reset);

  // 백엔드가 받는 필터만 쿼리 파라미터로.
  const params = useMemo(
    () => filtersToParams({ sort, regions, price, serviceFields, toggles }),
    [sort, regions, price, serviceFields, toggles],
  );

  const { data, isLoading, isError, refetch } = useShops(params);

  // 받은 목록에 클라 후처리(이름검색·price_desc) → 뷰모델 변환.
  const shops = useMemo(() => {
    let items = data?.items ?? [];
    if (search) items = items.filter((it) => it.name.includes(search));
    if (sort === 'price_desc') {
      items = [...items].sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
    }
    return items.map((it) => toShopCardView(it, favoriteIds));
  }, [data, search, sort, favoriteIds]);

  const toggleFavorite = (id: string) =>
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 현재위치 → 지도 카메라 이동. 권한 거부·실패 시 조용히 무동작.
  const handleLocate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      mapRef.current?.moveTo(pos.coords.latitude, pos.coords.longitude);
    } catch {
      // 무시
    }
  };

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-white">
        <HomeMap
          ref={mapRef}
          shops={shops}
          onMarkerPress={(id) => router.push(`/shop/${id}`)}
        />

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
          <CurrentLocationButton onPress={handleLocate} />
        </View>

        <ShopBottomSheet
          shops={shops}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onToggleFavorite={toggleFavorite}
          onReset={reset}
        />
      </View>
    </BottomSheetModalProvider>
  );
}
