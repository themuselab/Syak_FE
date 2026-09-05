import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { useFavoriteShopIds, useToggleFavorite } from '@/shared/domain/favorite/favorite.queries';
import { useSlotSearch } from '@/shared/domain/reservation/reservation.queries';
import { useShops } from '@/shared/domain/shops/shops.queries';
import type { MapBounds } from '@/shared/domain/shops/shops.types';
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
// 위치 미동의 시 기본 지도 중심(개선 요청) — 강남역.
const GANGNAM = { lat: 37.4979, lng: 127.0276 };
// 첫 카메라 idle·현위치 이동 전 임시 영역(첫 idle에 실제 화면영역으로 대체). 대략 줌14 화면 크기.
function boundsAround(c: { lat: number; lng: number }): MapBounds {
  return { swLat: c.lat - 0.02, neLat: c.lat + 0.02, swLng: c.lng - 0.025, neLng: c.lng + 0.025 };
}
const INITIAL_BOUNDS: MapBounds = boundsAround(GANGNAM);

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<HomeMapRef>(null);

  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;
  const favoriteIds = useFavoriteShopIds(isLoggedIn); // 비회원 → 빈 Set(별 항상 꺼짐)
  const toggleFavoriteOnServer = useToggleFavorite();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  // 지도 중심(카메라 idle마다 갱신) — 거리순 정렬 기준.
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(GANGNAM);
  // 지도 화면영역(bounds) — 목록·핀 공통 조회 기준(웹모델: 보이는 영역=목록=핀). 카메라 idle마다 갱신.
  const [mapBounds, setMapBounds] = useState<MapBounds>(INITIAL_BOUNDS);
  // 내 위치 점(파란 마커) = 실제 GPS 좌표. 지도 중심과 별개.
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  // GPS 좌표 획득 대기(수 초 걸릴 수 있음) — 버튼에 스피너를 띄워 "눌러도 무반응"을 없앤다(QA #56).
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // 헤더+검색바 오버레이 높이(onLayout 측정) — 시트 최대 확장 한계 계산용 (QA #50).
  const [headerHeight, setHeaderHeight] = useState(0);
  // 루트 컨테이너 실측 높이 — gorhom이 스냅포인트를 정규화할 때 쓰는 기준과 동일해야 한다.
  // useWindowDimensions는 안드 상태바 처리에 따라 이 값과 어긋나 시트 최대 확장이 검색바를
  // 덮거나 틈이 생긴다(사용자 피드백) — 시트·내 위치 버튼 모두 이 실측값을 쓴다.
  const [containerHeight, setContainerHeight] = useState(0);

  // 홈 최초 진입 시 위치 권한 요청. 허용 → 내 위치 점 + 지도 이동. 중심/영역도 내 위치로 즉시 세팅
  // (카메라 idle 전 강남 조회 깜빡임 방지) → 이후 idle이 실제 화면영역으로 갱신. 미동의 → 강남 유지.
  useEffect(() => {
    getCurrentCoords().then((coords) => {
      if (!coords) return;
      setMyLocation(coords);
      setMapCenter(coords);
      setMapBounds(boundsAround(coords));
      mapRef.current?.moveTo(coords.lat, coords.lng);
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

  // 목록 조회 (웹모델: 목록·핀이 같은 소스 → 항상 일치):
  //  - 지역 필터가 있으면 그 지역(districts) 전체로 조회 → 위치/bounds 안 보냄(먼 지역 필터해도 나오게).
  //  - 없으면 지도 화면영역(bounds) 안 샵 + 중심(mapCenter) 거리순. 지도 이동 시 idle이 갱신(자동, 웹처럼).
  //    limit 500으로 화면 안 샵을 최대한 다 받아 핀=목록으로 렌더(클러스터링으로 성능 확보).
  const hasRegionFilter = regions.length > 0;
  const listParams = useMemo(() => {
    if (hasRegionFilter) return slotParams !== null ? { ...params, limit: 100 } : params;
    return {
      ...params,
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      swLat: mapBounds.swLat,
      swLng: mapBounds.swLng,
      neLat: mapBounds.neLat,
      neLng: mapBounds.neLng,
      limit: slotParams !== null ? 100 : 500,
    };
  }, [params, slotParams, hasRegionFilter, mapCenter, mapBounds]);

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

  // 지도 핀 = 목록(shops)과 동일 소스 → 핀과 바텀시트 리스트가 항상 일치("이 핀이 리스트 여기").
  const pins = useMemo(
    () =>
      shops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({ id: s.id, lat: s.lat!, lng: s.lng!, markerKind: s.markerKind })),
    [shops],
  );

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

  // 지도 카메라가 멈추면(idle) 중심·영역을 갱신 → 목록·핀이 그 화면영역으로 자동 재조회(웹모델).
  // bounds는 소수 4자리(~11m)로 반올림해 미세 흔들림에 의한 불필요한 재조회를 억제.
  const handleCameraIdle = (e: { lat: number; lng: number; bounds?: MapBounds }) => {
    setMapCenter({ lat: e.lat, lng: e.lng });
    if (e.bounds) {
      const r = (n: number) => Math.round(n * 10000) / 10000;
      setMapBounds({
        swLat: r(e.bounds.swLat), swLng: r(e.bounds.swLng),
        neLat: r(e.bounds.neLat), neLng: r(e.bounds.neLng),
      });
    }
  };

  // 핀 탭: 목록(shops)에 있으면 인라인 포커스(기존 UX), 목록 밖(영역 전체 핀)이면 상세로 이동.
  const handleMarkerPress = (id: string) => {
    if (shops.some((s) => s.id === id)) setSelectedShopId(id);
    else router.push(`/shop/${id}`);
  };

  // 현재위치 버튼: 최신 GPS로 내 위치 점 + 지도 재중심. 목록·핀은 지도 이동 후 카메라 idle이 갱신.
  const handleRecenter = async () => {
    setNearbyLoading(true);
    try {
      const coords = await getCurrentCoords(true); // 항상 최신 GPS
      if (!coords) return;
      setMyLocation(coords);
      setMapCenter(coords);
      setMapBounds(boundsAround(coords)); // idle 전에도 즉시 내 위치 영역 조회
      mapRef.current?.moveTo(coords.lat, coords.lng);
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
          pins={pins}
          onMarkerPress={handleMarkerPress}
          onMapPress={() => {
            Keyboard.dismiss(); // 검색 키보드가 지도 탭으로 닫히지 않던 문제(QA #60)
            setSelectedShopId(null);
          }}
          myLocation={myLocation}
          onCameraIdle={handleCameraIdle}
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

        {/* 지도 이동 시 목록·핀이 자동 갱신되므로(웹모델) "현 지도에서 검색" 버튼은 없음. */}

        {/* 현재위치 버튼 (지도 우하단, 기본 시트 40% 상단 위 16px — 컨테이너 실측 기준이라 안 겹침).
            버튼 위치는 디자인 그대로 두고, SDK 줌 컨트롤을 mapPadding으로 이 위에 올렸다(QA #55).
            시트를 위로 올리면 버튼이 가려지는 것은 확정 정책(#45 — 버튼 고정). */}
        <View className="absolute right-4" style={{ bottom: sheetDefaultHeight + 16 }}>
          <CurrentLocationButton
            onPress={handleRecenter}
            active={myLocation !== null}
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
