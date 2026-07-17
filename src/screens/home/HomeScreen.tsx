import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { useFavoriteShopIds, useToggleFavorite } from '@/shared/domain/favorite/favorite.queries';
import { useSlotSearch } from '@/shared/domain/reservation/reservation.queries';
import { useShops } from '@/shared/domain/shops/shops.queries';
import { getCurrentCoords } from '@/shared/lib/location';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { LoginPromptModal } from '@/shared/ui/LoginPromptModal';

import { CurrentLocationButton } from './components/CurrentLocationButton';
import { HomeHeader } from './components/HomeHeader';
import { HomeMap, type HomeMapRef } from './components/HomeMap';
import { SearchBar } from './components/SearchBar';
import { ShopBottomSheet } from './components/ShopBottomSheet';
import { filtersToParams, toSlotSearchParams } from './filtersToParams';
import { toShopCardView } from './shopToView';
import { useHomeFilterStore } from './useHomeFilterStore';

// 홈(지도뷰). 네이버 지도 + GET /shops(비회원 가능).
// 필터·검색·정렬은 전부 서버 파라미터(filtersToParams). 시간 필터만 /slots/search 교집합.
// 즐겨찾기는 /favorites 서버 연동(단일 캐시, 낙관적 업데이트) — 비회원 별 탭은 LoginPromptModal 게이팅.
// 핀/카드 탭 → 특정샵 포커스(포커스 핀 + 시트 35% 인라인 상세, 올리면 풀스크린), 지도 빈 곳 탭 → 해제.
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const mapRef = useRef<HomeMapRef>(null);

  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;
  const favoriteIds = useFavoriteShopIds(isLoggedIn); // 비회원 → 빈 Set(별 항상 꺼짐)
  const toggleFavoriteOnServer = useToggleFavorite();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  // 내 주변 모드(현재위치 버튼 토글). 필터 화면과 무관한 홈 전용 상태라 필터 store가 아닌 로컬.
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);
  // 헤더+검색바 오버레이 높이(onLayout 측정) — 시트 최대 확장 한계 계산용 (QA #50).
  const [headerHeight, setHeaderHeight] = useState(0);

  // 홈 최초 진입 시 위치 권한 즉시 요청(QA #40·#52 — 사용자 확정: 온보딩 화면 대신 이 방식).
  // 허용 시 지도 카메라만 내 위치로 이동 — 내 주변 모드(목록 필터·버튼 활성)는 버튼 탭으로만 켜짐.
  // 거부 시 조용히 무시(서울 초기 카메라 유지).
  useEffect(() => {
    getCurrentCoords().then((coords) => {
      if (coords) mapRef.current?.moveTo(coords.lat, coords.lng);
    });
  }, []);

  const sort = useHomeFilterStore((s) => s.sort);
  const regions = useHomeFilterStore((s) => s.regions);
  const prices = useHomeFilterStore((s) => s.prices);
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
      filtersToParams({ search: debouncedSearch, sort, regions, prices, date, times, serviceFields, toggles }),
    [debouncedSearch, sort, regions, prices, date, times, serviceFields, toggles],
  );

  // 시간 필터: 선택한 날짜×시간에 빈 슬롯 있는 샵을 /slots/search로 받아 목록과 교집합.
  const slotParams = useMemo(() => toSlotSearchParams({ date, times, regions }), [date, times, regions]);

  // 시간 필터 중엔 교집합이 페이지 단위로 잘리지 않게 100개 단일 조회(무한스크롤 비활성).
  // 내 주변 모드면 lat/lng 병합(radius는 서버 기본 5km) — params가 queryKey라 토글 시 1페이지부터 리셋.
  const listParams = useMemo(() => {
    const base = slotParams !== null ? { ...params, limit: 100 } : params;
    return nearbyCoords ? { ...base, lat: nearbyCoords.lat, lng: nearbyCoords.lng } : base;
  }, [params, slotParams, nearbyCoords]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useShops(listParams);
  const slotSearch = useSlotSearch(
    slotParams ?? { dates: [], times: [] },
    slotParams !== null,
  );

  const loading = isLoading || (slotParams !== null && slotSearch.isLoading);
  const error = isError || (slotParams !== null && slotSearch.isError);

  const shops = useMemo(() => {
    // 페이지 누적 flat + id 중복 제거(offset 페이지네이션 특성상 페이지 간 중복 가능 — key 중복 경고 방지).
    const flat = data?.pages.flatMap((p) => p.items) ?? [];
    const seen = new Set<string>();
    let items = flat.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
    if (slotParams !== null) {
      if (!slotSearch.data) return []; // 교집합 대상 미도착(로딩/에러) — 위 loading/error가 화면 처리
      const allowed = new Set(slotSearch.data.shops.map((s) => s.shopId));
      items = items.filter((it) => allowed.has(it.id));
    }
    return items.map((it) => toShopCardView(it, favoriteIds));
  }, [data, slotParams, slotSearch.data, favoriteIds]);

  // 핀/카드 탭으로 포커스된 매장. 필터 변경으로 목록에서 빠지면 자동 해제(null).
  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) ?? null,
    [shops, selectedShopId],
  );

  // 목록 카드 탭 → 핀 탭과 동일한 포커스 플로우(사용자 확정). 화면 밖 매장일 수 있어 카메라도 이동.
  const selectShop = (id: string) => {
    setSelectedShopId(id);
    const shop = shops.find((s) => s.id === id);
    if (shop?.lat != null && shop.lng != null) mapRef.current?.moveTo(shop.lat, shop.lng);
  };

  // 리스트 끝 도달 시 다음 페이지 로드. 시간 필터 중엔 비활성(100개 단일 조회).
  const loadMore = () => {
    if (slotParams === null && hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  // 비회원은 로그인 유도, 회원은 서버 토글(낙관적 업데이트라 즉시 반영).
  const toggleFavorite = (id: string) => {
    if (!isLoggedIn) {
      setLoginModalVisible(true);
      return;
    }
    toggleFavoriteOnServer(id);
  };

  // 현재위치 버튼 = 내 주변 토글(사용자 확정): 켜면 카메라 이동 + 목록을 내 주변(서버 기본 5km)으로,
  // 다시 누르면 해제(전체 목록, 카메라 유지·위치 재조회 없음). 권한 거부·실패 시 조용히 무동작(모드 안 켜짐).
  // 모드 표시 = 지도 내 위치 마커 + 버튼 아이콘 파랑(토글 시점 좌표 1회 고정 — 목록 검색 기준과 일치, 사용자 확정).
  const handleNearbyToggle = async () => {
    if (nearbyCoords) {
      setNearbyCoords(null);
      return;
    }
    const coords = await getCurrentCoords();
    if (!coords) return;
    mapRef.current?.moveTo(coords.lat, coords.lng);
    setNearbyCoords(coords);
  };

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-white">
        <HomeMap
          ref={mapRef}
          shops={shops}
          onMarkerPress={setSelectedShopId}
          onMapPress={() => setSelectedShopId(null)}
          myLocation={nearbyCoords}
          selectedShopId={selectedShopId}
        />

        {/* 상단 핑크 그라데이션 */}
        <LinearGradient
          colors={['#c24a6b33', '#c24a6b00']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 150 }}
        />

        {/* 헤더 + 검색. 높이를 측정해 시트 최대 확장이 검색바 아래에서 멈추게 한다(QA #50). */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <HomeHeader />
          <View className="px-5 pt-3">
            <SearchBar />
          </View>
        </View>

        {/* 현재위치 버튼 (지도 우하단, 바텀시트 위) */}
        <View className="absolute right-4" style={{ bottom: height * 0.42 + 12 }}>
          <CurrentLocationButton onPress={handleNearbyToggle} active={nearbyCoords !== null} />
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
          onEndReached={loadMore}
          isFetchingNextPage={slotParams === null && isFetchingNextPage}
          onSelectShop={selectShop}
          onDeselect={() => setSelectedShopId(null)}
          topOffset={headerHeight}
        />

        {/* 비회원 별 탭 게이팅. 로그인 이동 전 모달을 먼저 닫아야 push된 로그인 화면을 안 덮는다. */}
        <LoginPromptModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          onPressLogin={() => {
            setLoginModalVisible(false);
            router.push('/login');
          }}
        />
      </View>
    </BottomSheetModalProvider>
  );
}
