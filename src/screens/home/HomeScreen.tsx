import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { RefreshCcw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFavoriteShopIds, useToggleFavorite } from '@/shared/domain/favorite/favorite.queries';
import { useSlotSearch } from '@/shared/domain/reservation/reservation.queries';
import { useShops } from '@/shared/domain/shops/shops.queries';
import type { MapBounds } from '@/shared/domain/shops/shops.types';
import { distanceMeters } from '@/shared/lib/geo';
import {
  getCurrentCoords,
  getLocationPermission,
  openLocationSettings,
} from '@/shared/lib/location';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { colors, shadow } from '@/shared/theme/colors';
import { LocationPermissionModal } from '@/shared/ui/LocationPermissionModal';
import { useLoginGate } from '@/shared/ui/loginGate';

import { CategoryChipBar } from './components/CategoryChipBar';
import { CurrentLocationButton } from './components/CurrentLocationButton';
import { HomeMap, type HomeMapRef } from './components/HomeMap';
import { SearchBar } from './components/SearchBar';
import { ShopBottomSheet, type ShopBottomSheetRef } from './components/ShopBottomSheet';
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

// 위치 권한 안내 팝업은 앱 실행 중 한 번만 자동으로 띄운다. 홈에 돌아올 때마다 뜨면 귀찮다.
// (현재위치 버튼을 누르면 권한이 없을 때 다시 뜬다 — 사용자가 직접 원한 경우라서)
let permissionPromptShown = false;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<HomeMapRef>(null);
  const sheetRef = useRef<ShopBottomSheetRef>(null);

  const { isLoggedIn, requireLogin, loginModal } = useLoginGate();
  const favoriteIds = useFavoriteShopIds(isLoggedIn); // 비회원 → 빈 Set(별 항상 꺼짐)
  const toggleFavoriteOnServer = useToggleFavorite();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  // 지도 중심(카메라 idle마다 갱신) — 거리순 정렬 기준.
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(GANGNAM);
  // 지도 화면영역(bounds) — 목록·핀 공통 조회 기준(웹모델: 보이는 영역=목록=핀). 카메라 idle마다 갱신.
  const [mapBounds, setMapBounds] = useState<MapBounds>(INITIAL_BOUNDS);
  // 내 위치 점(파란 마커) = 실제 GPS 좌표. 지도 중심과 별개.
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  // AppState 리스너(한 번만 등록)에서 최신 값을 읽기 위한 ref.
  const myLocationRef = useRef(myLocation);
  myLocationRef.current = myLocation;
  // GPS 좌표 획득 대기(수 초 걸릴 수 있음) — 버튼에 스피너를 띄워 "눌러도 무반응"을 없앤다(QA #56).
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // 헤더+검색바 오버레이 높이(onLayout 측정) — 시트 최대 확장 한계 계산용 (QA #50).
  const [headerHeight, setHeaderHeight] = useState(0);
  // 검색창 포커스 — 네이버 지도처럼 포커스되면 알림·프로필 아이콘과 카테고리 칩을 숨겨
  // 검색창이 가로로 넓어진다(디자이너 시안).
  const [searchFocused, setSearchFocused] = useState(false);
  // 루트 컨테이너 실측 높이 — gorhom이 스냅포인트를 정규화할 때 쓰는 기준과 동일해야 한다.
  // useWindowDimensions는 안드 상태바 처리에 따라 이 값과 어긋나 시트 최대 확장이 검색바를
  // 덮거나 틈이 생긴다(사용자 피드백) — 시트·내 위치 버튼 모두 이 실측값을 쓴다.
  const [containerHeight, setContainerHeight] = useState(0);

  // 위치 권한 안내 팝업(디자이너 시안 "위치권한 팝업").
  const [permissionModal, setPermissionModal] = useState(false);

  // 내 위치로 지도·목록 기준점을 옮긴다. 중심/영역을 즉시 세팅해 카메라 idle 전 강남 조회
  // 깜빡임을 막고, 이후 idle이 실제 화면영역으로 갱신한다.
  const applyMyLocation = (coords: { lat: number; lng: number }) => {
    setMyLocation(coords);
    setMapCenter(coords);
    setMapBounds(boundsAround(coords));
    mapRef.current?.moveTo(coords.lat, coords.lng);
  };

  // 홈 최초 진입: 권한이 이미 있으면 바로 내 위치. 없으면 OS 팝업을 바로 띄우지 않고 안내 팝업부터
  // (예전엔 진입하자마자 OS 팝업이 떠서 왜 필요한지 모른 채 거부하기 쉬웠다). 미동의 → 강남 유지.
  useEffect(() => {
    getLocationPermission().then(({ granted }) => {
      if (granted) {
        getCurrentCoords().then((c) => c && applyMyLocation(c));
      } else if (!permissionPromptShown) {
        permissionPromptShown = true;
        setPermissionModal(true);
      }
    });
  }, []);

  // 설정 앱에서 권한을 켜고 돌아오면 바로 내 위치를 반영한다(앱 재시작 없이).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || myLocationRef.current) return;
      getLocationPermission().then(({ granted }) => {
        if (granted) getCurrentCoords().then((c) => c && applyMyLocation(c));
      });
    });
    return () => sub.remove();
  }, []);

  // "위치 권한 설정하기": 아직 물어볼 수 있으면 OS 팝업, 이미 영구 거부했으면 설정 앱으로.
  const handleAllowLocation = async () => {
    setPermissionModal(false);
    const { canAskAgain } = await getLocationPermission();
    if (!canAskAgain && Platform.OS !== 'web') {
      await openLocationSettings();
      return;
    }
    const coords = await getCurrentCoords(); // 여기서 OS 권한 팝업이 뜬다
    if (coords) applyMyLocation(coords);
  };

  const sort = useHomeFilterStore((s) => s.sort);
  const picked = useHomeFilterStore((s) => s.picked);
  const priceRange = useHomeFilterStore((s) => s.priceRange);
  const date = useHomeFilterStore((s) => s.date);
  const times = useHomeFilterStore((s) => s.times);
  const toggles = useHomeFilterStore((s) => s.toggles);
  const search = useHomeFilterStore((s) => s.search);
  const reset = useHomeFilterStore((s) => s.reset);

  // 검색어는 타이핑마다 store에 반영되므로 서버 요청은 디바운스 값으로만.
  const debouncedSearch = useDebouncedValue(search);

  const params = useMemo(
    () =>
      filtersToParams({ search: debouncedSearch, sort, picked, priceRange, date, times, toggles }),
    [debouncedSearch, sort, picked, priceRange, date, times, toggles],
  );

  // 시간 필터: 선택한 날짜×시간에 빈 슬롯 있는 샵을 /slots/search로 받아 목록과 교집합.
  const slotParams = useMemo(() => toSlotSearchParams({ date, times }), [date, times]);

  // 목록 조회 (웹모델: 목록·핀이 같은 소스 → 항상 일치):
  //  지도 화면영역(bounds) 안 샵 + 중심(mapCenter) 거리순. 지도 이동 시 idle이 갱신(자동, 웹처럼).
  // 검색어가 있으면 결과가 지금 보이는 지도 밖(예: "천호")일 수 있다. bounds·위치를 보내면
  // 백엔드가 화면영역/반경 5km로 잘라내 "조건에 맞는 샵 없음"이 되므로 검색 중엔 빼고 보낸다.
  const hasSearch = debouncedSearch.trim().length > 0;
  const listParams = useMemo(() => {
    if (hasSearch) return { ...params, limit: slotParams !== null ? 100 : 60 };
    // 화면 안 "가까운순" 상위 60개만 — 목록·핀 공용. (500개는 카드/이미지 과다로 버벅·이미지 빈칸)
    return {
      ...params,
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      swLat: mapBounds.swLat,
      swLng: mapBounds.swLng,
      neLat: mapBounds.neLat,
      neLng: mapBounds.neLng,
      limit: 60,
    };
  }, [params, slotParams, hasSearch, mapCenter, mapBounds]);

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
    // toggles 전달: 토글이 켜진 동안은 핀 색을 그 조건으로 통일한다(할인=노랑/당일예약=파랑).
    return items.map((it) => toShopCardView(it, favoriteIds, toggles, myLocation));
  }, [data, slotParams, slotSearch.data, favoriteIds, toggles, myLocation]);

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

  // 지역 검색 결과는 화면 밖이라 그냥 두면 "검색했는데 지도는 그대로"가 된다. 첫 결과로 카메라를
  // 옮겨준다. 같은 검색어로는 한 번만 — 이후 사용자가 지도를 움직인 걸 되돌리지 않는다.
  const pannedSearchRef = useRef<string | null>(null);
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) {
      pannedSearchRef.current = null;
      return;
    }
    if (pannedSearchRef.current === q) return;
    const first = shops.find((s) => s.lat != null && s.lng != null);
    if (!first) return;
    pannedSearchRef.current = q;
    mapRef.current?.moveTo(first.lat!, first.lng!);
  }, [debouncedSearch, shops]);

  // "현 지도에서 검색"은 지도가 내 위치(없으면 기본 중심)에서 벗어났을 때만 띄운다
  // (디자이너 시안 프레임 "현위치 벗어날시"). 기준 거리는 동네 한 블록 정도인 500m.
  const awayFromHere = distanceMeters(mapCenter, myLocation ?? GANGNAM) > 500;

  const selectedShop = useMemo(
    () => shops.find((s) => s.id === selectedShopId) ?? null,
    [shops, selectedShopId],
  );

  // 목록 카드 탭 → 인라인 상세로 포커스. 목록 샵은 이미 화면 안(bounds)이라 카메라는 안 옮긴다
  // (옮기면 카메라 idle→자동 재조회로 목록이 재정렬·이미지 재로딩되며 튄다). 포커스 핀만 강조.
  const selectShop = (id: string) => {
    Keyboard.dismiss(); // 검색 후 카드 탭 → 상세로 넘어가며 키보드도 정리(QA #60)
    setSelectedShopId(id);
  };

  // 리스트 끝 도달 시 다음 페이지 로드. 시간 필터 중엔 비활성(100개 단일 조회).
  const loadMore = () => {
    if (slotParams === null && hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  // 비회원은 로그인 유도, 회원은 서버 토글(낙관적 업데이트라 즉시 반영).
  const toggleFavorite = (id: string) => requireLogin(() => toggleFavoriteOnServer(id));

  // "현 지도에서 검색": 지금 보이는 영역으로 즉시 재조회. 지도 이동 시 자동 갱신과 병행하는
  // 수동 트리거(사용자가 직접 확인하고 싶을 때) — 조회 기준(bounds)은 이미 현재 화면이다.
  const searchHere = () => {
    refetch();
    if (slotParams !== null) slotSearch.refetch();
  };

  // 지도 카메라가 멈추면(idle) 중심·영역을 갱신 → 목록·핀이 그 화면영역으로 자동 재조회(웹모델).
  // bounds는 소수 4자리(~11m)로 반올림해 미세 흔들림에 의한 불필요한 재조회를 억제.
  const handleCameraIdle = (e: { lat: number; lng: number; bounds?: MapBounds }) => {
    setMapCenter({ lat: e.lat, lng: e.lng });
    if (e.bounds) {
      const r = (n: number) => Math.round(n * 1000) / 1000; // ~100m 단위 반올림(미세 이동 재조회 억제)
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
  // 권한이 없으면 아무 반응 없이 끝나던 것을, 안내 팝업으로 바꿨다(눌러도 무반응 방지).
  const handleRecenter = async () => {
    const { granted } = await getLocationPermission();
    if (!granted) {
      setPermissionModal(true);
      return;
    }
    setNearbyLoading(true);
    try {
      const coords = await getCurrentCoords(true); // 항상 최신 GPS
      if (coords) applyMyLocation(coords);
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
            // 시트 밖(지도)을 누르면: 상세 포커스 중이면 해제(→목록), 목록이면 시트를 최소로 접어
            // 지도를 넓게 본다. 접힘은 gorhom 스냅 애니메이션으로 부드럽게 내려간다(디자인 요청).
            if (selectedShopId) setSelectedShopId(null);
            else sheetRef.current?.collapse();
          }}
          myLocation={myLocation}
          onCameraIdle={handleCameraIdle}
          selectedShopId={selectedShopId}
          topPadding={headerHeight}
          bottomPadding={sheetDefaultHeight + MAP_CONTROL_CLEARANCE}
        />

        {/* 헤더 + 검색. 높이를 측정해 시트 최대 확장이 검색바 아래에서 멈추게 한다(QA #50).
            세로 높이 축소(QA #61): insets.top + 104 → insets.top + 88. */}
        <View
          // box-none: 로고와 아이콘 사이 빈 공간의 탭이 지도로 내려가야 키보드가 닫힌다(QA #60).
          pointerEvents="box-none"
          style={{ paddingTop: insets.top + 4 }}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          {/* 검색바 — 프로필 아이콘이 안쪽에 들어있다(시안). 알림 벨은 시안에서 빠졌다. */}
          <View pointerEvents="box-none" className="px-5">
            <SearchBar focused={searchFocused} onFocusChange={setSearchFocused} />
          </View>

          {/* 샥 파트너 + 시술분야 칩. 헤더 View 안이라 headerHeight 측정에 포함되고, 시트 최대 확장·
              mapPadding이 자동으로 따라간다. 검색 중이거나 이미 하나를 골랐으면 숨긴다(시안). */}
          {!searchFocused && !picked && (
            <View pointerEvents="box-none" className="pt-2">
              <CategoryChipBar />
            </View>
          )}

          {/* 현 지도에서 검색 — 지도를 내 위치에서 옮겼을 때만. 검색어 중엔 화면영역으로 조회하지 않아 숨김. */}
          {awayFromHere && !hasSearch && !searchFocused && (
            <View pointerEvents="box-none" className="items-center pt-2">
              <Pressable
                onPress={searchHere}
                className="flex-row items-center gap-1.5 rounded-full bg-white px-4 py-2"
                style={shadow.md}
              >
                <RefreshCcw size={15} color={colors.text.muted} />
                <Text
                  className="text-label-l font-pretendard-semibold"
                  style={{ color: colors.text.strong }}
                >
                  현 지도에서 검색
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 현재위치 버튼 (지도 우하단, 기본 시트 40% 상단 위 16px — 컨테이너 실측 기준이라 안 겹침).
            버튼 위치는 디자인 그대로 두고, SDK 줌 컨트롤을 mapPadding으로 이 위에 올렸다(QA #55).
            시트를 위로 올리면 버튼이 가려지는 것은 확정 정책(#45 — 버튼 고정). */}
        <View className="absolute right-4" style={{ bottom: sheetDefaultHeight + 20 }}>
          <CurrentLocationButton
            onPress={handleRecenter}
            active={myLocation !== null}
            loading={nearbyLoading}
          />
        </View>

        <ShopBottomSheet
          ref={sheetRef}
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

        <LocationPermissionModal
          visible={permissionModal}
          onAllow={handleAllowLocation}
          onClose={() => setPermissionModal(false)}
        />
        {loginModal}
      </View>
    </BottomSheetModalProvider>
  );
}
