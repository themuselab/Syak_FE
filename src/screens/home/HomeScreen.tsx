import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
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
import { MAP_CONTROL_CLEARANCE, SHEET_DEFAULT_RATIO } from './homeLayout';
import { toShopCardView } from './shopToView';
import { useHomeFilterStore } from './useHomeFilterStore';

// 홈(지도뷰). 네이버 지도 + GET /shops(비회원 가능).
// 필터·검색·정렬은 전부 서버 파라미터(filtersToParams). 시간 필터만 /slots/search 교집합.
// 즐겨찾기는 /favorites 서버 연동(단일 캐시, 낙관적 업데이트) — 비회원 별 탭은 LoginPromptModal 게이팅.
// 핀/카드 탭 → 특정샵 포커스(포커스 핀 + 시트 35% 인라인 상세, 올리면 풀스크린), 지도 빈 곳 탭 → 해제.
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<HomeMapRef>(null);

  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;
  const favoriteIds = useFavoriteShopIds(isLoggedIn); // 비회원 → 빈 Set(별 항상 꺼짐)
  const toggleFavoriteOnServer = useToggleFavorite();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  // 내 주변 모드(현재위치 버튼 토글). 필터 화면과 무관한 홈 전용 상태라 필터 store가 아닌 로컬.
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);
  // GPS 좌표 획득 대기(수 초 걸릴 수 있음) — 버튼에 스피너를 띄워 "눌러도 무반응"을 없앤다(QA #56).
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // 헤더+검색바 오버레이 높이(onLayout 측정) — 시트 최대 확장 한계 계산용 (QA #50).
  const [headerHeight, setHeaderHeight] = useState(0);
  // 루트 컨테이너 실측 높이 — gorhom이 스냅포인트를 정규화할 때 쓰는 기준과 동일해야 한다.
  // useWindowDimensions는 안드 상태바 처리에 따라 이 값과 어긋나 시트 최대 확장이 검색바를
  // 덮거나 틈이 생긴다(사용자 피드백) — 시트·내 위치 버튼 모두 이 실측값을 쓴다.
  const [containerHeight, setContainerHeight] = useState(0);

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
  // 시트 기본(40%) 위치의 높이 — 내 위치 버튼·지도 컨트롤을 이 선 위에 배치한다.
  // 측정 전(0)엔 0이라 한 프레임만 하단에 붙었다가 onLayout 직후 제자리로 간다.
  const sheetDefaultHeight = containerHeight * SHEET_DEFAULT_RATIO;

  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) ?? null,
    [shops, selectedShopId],
  );

  // 목록 카드 탭 → 핀 탭과 동일한 포커스 플로우(사용자 확정). 화면 밖 매장일 수 있어 카메라도 이동.
  const selectShop = (id: string) => {
    Keyboard.dismiss(); // 검색 후 카드 탭 → 상세로 넘어가며 키보드도 정리(QA #60)
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

  // 현재위치 버튼: 누를 때마다 항상 "내 최신 위치로 카메라 재중심"(옛 좌표 캐시 안 씀 → fresh).
  // 동시에 '내 주변'(서버 기본 5km) 필터를 토글한다. 이전엔 켜진 상태에서 누르면 이동 없이
  // 꺼지기만 해서 "버튼 눌러도 내 위치로 안 감"으로 보였다(사용자 제보) → 항상 재중심하도록 수정.
  const handleNearbyToggle = async () => {
    setNearbyLoading(true);
    try {
      const coords = await getCurrentCoords(true); // 항상 최신 GPS
      if (!coords) return;
      mapRef.current?.moveTo(coords.lat, coords.lng); // 누를 때마다 내 위치로 재중심
      setNearbyCoords((prev) => (prev ? null : coords)); // 내 주변 필터 on/off 토글
    } finally {
      setNearbyLoading(false);
    }
  };

  return (
    <BottomSheetModalProvider>
      <View
        className="flex-1 bg-white"
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      >
        {/* mapPadding: SDK 기본 컨트롤(+/-)·네이버 로고를 헤더 아래 / 시트 위 영역으로 밀어낸다.
            없으면 지도 뷰(absoluteFill) 최하단에 밀착해 시트 뒤로 완전히 가려진다(QA #55). */}
        <HomeMap
          ref={mapRef}
          shops={shops}
          onMarkerPress={setSelectedShopId}
          onMapPress={() => {
            Keyboard.dismiss(); // 검색 키보드가 지도 탭으로 닫히지 않던 문제(QA #60)
            setSelectedShopId(null);
          }}
          myLocation={nearbyCoords}
          selectedShopId={selectedShopId}
          topPadding={headerHeight}
          bottomPadding={sheetDefaultHeight + MAP_CONTROL_CLEARANCE}
        />

        {/* 상단 핑크 그라데이션 (장식 전용).
            pointerEvents="none" 없으면 헤더보다 아래로 뻗은 구간이 지도 탭을 먹는다(QA #60). */}
        <LinearGradient
          colors={['#c24a6b33', '#c24a6b00']}
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 130 }}
        />

        {/* 헤더 + 검색. 높이를 측정해 시트 최대 확장이 검색바 아래에서 멈추게 한다(QA #50).
            세로 높이 축소(QA #61): insets.top + 104 → insets.top + 88. */}
        <View
          // box-none: 로고와 아이콘 사이 빈 공간의 탭이 지도로 내려가야 키보드가 닫힌다(QA #60).
          pointerEvents="box-none"
          style={{ paddingTop: insets.top + 4 }}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <HomeHeader />
          <View pointerEvents="box-none" className="px-5 pt-2">
            <SearchBar />
          </View>
        </View>

        {/* 현재위치 버튼 (지도 우하단, 기본 시트 40% 상단 위 16px — 컨테이너 실측 기준이라 안 겹침).
            버튼 위치는 디자인 그대로 두고, SDK 줌 컨트롤을 mapPadding으로 이 위에 올렸다(QA #55).
            시트를 위로 올리면 버튼이 가려지는 것은 확정 정책(#45 — 버튼 고정). */}
        <View className="absolute right-4" style={{ bottom: sheetDefaultHeight + 16 }}>
          <CurrentLocationButton
            onPress={handleNearbyToggle}
            active={nearbyCoords !== null}
            loading={nearbyLoading}
          />
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
          containerHeight={containerHeight}
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
