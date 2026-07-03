import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSlotSearch } from '@/shared/domain/reservation/reservation.queries';
import { useShops } from '@/shared/domain/shops/shops.queries';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

import { CurrentLocationButton } from './components/CurrentLocationButton';
import { HomeHeader } from './components/HomeHeader';
import { HomeMap, type HomeMapRef } from './components/HomeMap';
import { SearchBar } from './components/SearchBar';
import { ShopBottomSheet } from './components/ShopBottomSheet';
import { filtersToParams, toSlotSearchParams } from './filtersToParams';
import { toShopCardView } from './shopToView';
import { useHomeFilterStore } from './useHomeFilterStore';

// 홈(지도뷰). 네이버 지도 + GET /shops(비회원 가능).
// 필터·검색·정렬은 전부 서버 파라미터(filtersToParams). 시간 필터만 /slots/search 교집합. 즐겨찾기는 1차 로컬.
// 핀 탭 → 바텀시트에 그 매장 미리보기(카드 1개), 지도 빈 곳 탭 → 해제.
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const mapRef = useRef<HomeMapRef>(null);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const sort = useHomeFilterStore((s) => s.sort);
  const regions = useHomeFilterStore((s) => s.regions);
  const price = useHomeFilterStore((s) => s.price);
  const date = useHomeFilterStore((s) => s.date);
  const times = useHomeFilterStore((s) => s.times);
  const serviceFields = useHomeFilterStore((s) => s.serviceFields);
  const toggles = useHomeFilterStore((s) => s.toggles);
  const search = useHomeFilterStore((s) => s.search);
  const reset = useHomeFilterStore((s) => s.reset);

  // 검색어는 타이핑마다 store에 반영되므로 서버 요청은 디바운스 값으로만.
  const debouncedSearch = useDebouncedValue(search);

  const params = useMemo(
    () =>
      filtersToParams({ search: debouncedSearch, sort, regions, price, date, times, serviceFields, toggles }),
    [debouncedSearch, sort, regions, price, date, times, serviceFields, toggles],
  );

  const { data, isLoading, isError, refetch } = useShops(params);

  // 시간 필터: 선택한 날짜×시간에 빈 슬롯 있는 샵을 /slots/search로 받아 목록과 교집합.
  const slotParams = useMemo(() => toSlotSearchParams({ date, times, regions }), [date, times, regions]);
  const slotSearch = useSlotSearch(
    slotParams ?? { dates: [], times: [] },
    slotParams !== null,
  );

  const loading = isLoading || (slotParams !== null && slotSearch.isLoading);
  const error = isError || (slotParams !== null && slotSearch.isError);

  const shops = useMemo(() => {
    let items = data?.items ?? [];
    if (slotParams !== null) {
      if (!slotSearch.data) return []; // 교집합 대상 미도착(로딩/에러) — 위 loading/error가 화면 처리
      const allowed = new Set(slotSearch.data.shops.map((s) => s.shopId));
      items = items.filter((it) => allowed.has(it.id));
    }
    return items.map((it) => toShopCardView(it, favoriteIds));
  }, [data, slotParams, slotSearch.data, favoriteIds]);

  // 핀 탭으로 선택된 매장. 필터 변경으로 목록에서 빠지면 자동 해제(null).
  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) ?? null,
    [shops, selectedShopId],
  );

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
          onMarkerPress={setSelectedShopId}
          onMapPress={() => setSelectedShopId(null)}
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
          selectedShop={selectedShop}
          isLoading={loading}
          isError={error}
          onRetry={() => {
            refetch();
            if (slotParams !== null) slotSearch.refetch();
          }}
          onToggleFavorite={toggleFavorite}
          onReset={reset}
        />
      </View>
    </BottomSheetModalProvider>
  );
}
