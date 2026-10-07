import {
  type MapImageProp,
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapBounds } from '@/shared/domain/shops/shops.types';

import type { MapPinView, MarkerKind } from '../shopToView';

// 마커 종류별 핀 PNG (assets/icons/pin-{kind}.png, 96×120 — 투명 여백 크롭본이라 24×30 렌더와 비율 일치).
// require(png)는 로컬 리소스 이미지로 전달된다.
const PIN: Record<MarkerKind, MapImageProp> = {
  default: require('../../../../assets/icons/pin-default.png') as MapImageProp,
  discount: require('../../../../assets/icons/pin-discount.png') as MapImageProp,
  reservable: require('../../../../assets/icons/pin-reservable.png') as MapImageProp,
};

// 축소 상태(스케일바 500m 이상)용 도트 마커. 핀과 같은 색이라 줌을 바꿔도 색이 안 튄다.
const DOT: Record<MarkerKind, MapImageProp> = {
  default: require('../../../../assets/icons/dot-default.png') as MapImageProp,
  discount: require('../../../../assets/icons/dot-discount.png') as MapImageProp,
  reservable: require('../../../../assets/icons/dot-reservable.png') as MapImageProp,
};

// 도트로 바꾸는 줌 기준. 스케일바 표기와 줌은 m/px = 156543 * cos(위도) / 2^zoom 관계라
// 서울 위도(37.5)에서 스케일바가 "500m"를 가리키는 지점이 zoom≈13.8이다. 그 아래(더 축소)면
// 핀이 서로 겹쳐 지도를 덮으므로 12px 도트로 떨어뜨린다. 클러스터 maxZoom(14)과도 맞물린다.
const DOT_ZOOM_THRESHOLD = 13.8;
const PIN_SIZE = { width: 24, height: 30 };
const DOT_SIZE = { width: 12, height: 12 };

// 내 위치 마커 (design.pen 내위치 마크업 wMGlf > markup_my — 파란 점 + 후광, 3배수 export).
const MY_LOCATION = require('../../../../assets/icons/marker-my-location.png') as MapImageProp;

// 포커스 핀 (design.pen 특정샵 포커스 euK3A > b6WWf — 56px 핑크 맵핀+상점 아이콘, 3배수 export).
const PIN_FOCUSED = require('../../../../assets/icons/pin-focused.png') as MapImageProp;

// 초기 카메라 = 강남역 (위치 미동의 시 기본 중심 — 개선 요청 #8).
const GANGNAM = { latitude: 37.4979, longitude: 127.0276, zoom: 14 };

export type HomeMapRef = { moveTo: (lat: number, lng: number) => void };

type Props = {
  pins: MapPinView[]; // 지도 영역 안 모든 샵(웹처럼 전부 표시) — 목록(반경)과 별개
  onMarkerPress: (id: string) => void;
  onMapPress?: () => void; // 핀 없는 빈 곳 탭 (포커스 해제)
  myLocation?: { lat: number; lng: number } | null; // 내 위치 점(GPS) (null = 마커 숨김)
  // 카메라 멈춤 → 지도 중심(목록 쿼리 기준) + 영역(bounds, 핀 조회 기준)
  onCameraIdle?: (e: { lat: number; lng: number; bounds?: MapBounds }) => void;
  selectedShopId?: string | null; // 포커스된 매장 — 해당 핀만 포커스 핀(56px)으로 교체
  topPadding?: number; // 헤더+검색바 높이 — SDK 컨트롤이 그 아래에 오도록
  bottomPadding?: number; // 바텀시트 최소 높이 — 줌 컨트롤·네이버 로고가 시트에 안 가리게
};

// 네이버 지도 + 샵 좌표 핀. 네이티브 전용(web/Expo Go는 HomeMap.web.tsx placeholder).
// 키(EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) 미발급 dev build에서도 안전하게 placeholder로 폴백.
export const HomeMap = forwardRef<HomeMapRef, Props>(
  (
    { pins, onMarkerPress, onMapPress, myLocation, onCameraIdle, selectedShopId, topPadding, bottomPadding },
    ref,
  ) => {
    const mapRef = useRef<NaverMapViewRef>(null);
    // 축소 여부만 상태로 둔다(줌 숫자를 그대로 담으면 idle마다 재렌더 — boolean은 값이 같으면 React가 생략).
    const [isDotZoom, setIsDotZoom] = useState(false);

    useImperativeHandle(ref, () => ({
      moveTo: (lat, lng) =>
        mapRef.current?.animateCameraTo({ latitude: lat, longitude: lng, zoom: 14 }),
    }));

    // 축소하면 근접 핀을 숫자로 묶고(클러스터), 확대하면 개별 핀으로 펼친다(디자인 요청).
    // maxZoom 이상으로 확대하면 클러스터링을 멈춰 평소의 물방울 핀이 그대로 보인다.
    // 포커스된 핀은 클러스터에서 제외하고 별도 오버레이로 항상 위에 크게 표시.
    const clusterMarkers = useMemo(
      () =>
        pins
          .filter((p) => p.id !== selectedShopId)
          .map((p) => ({
            identifier: p.id,
            latitude: p.lat,
            longitude: p.lng,
            image: isDotZoom ? DOT[p.markerKind] : PIN[p.markerKind],
            ...(isDotZoom ? DOT_SIZE : PIN_SIZE),
          })),
      [pins, selectedShopId, isDotZoom],
    );
    const focusedPin = useMemo(
      () => pins.find((p) => p.id === selectedShopId) ?? null,
      [pins, selectedShopId],
    );

    if (!process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) {
      return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e9edf1' }]} />;
    }

    return (
      <NaverMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCamera={GANGNAM}
        onTapMap={onMapPress}
        clusters={[{ animate: true, maxZoom: 14, markers: clusterMarkers }]}
        onTapClusterLeaf={({ markerIdentifier }) => onMarkerPress(markerIdentifier)}
        // 카메라가 멈추면 중심(e.latitude/longitude=카메라 타깃) + 화면영역(bounds)을 부모로.
        // ★ Region.latitude/longitude는 "남서(SW) 모서리"이고 delta는 SW→NE 전체 차이다(중심 아님!).
        //   그래서 SW=그대로, NE=SW+delta. (이전엔 중심±delta/2로 잘못 계산해 박스가 어긋나 빈 결과)
        onCameraIdle={(e) => {
          // 줌이 기준 아래로 내려가면 핀 -> 도트. 제스처 중이 아니라 멈춘 뒤에만 바꿔(onCameraIdle)
          // 핀치하는 내내 이미지가 교체되며 생기는 버벅임을 피한다.
          if (e.zoom != null) setIsDotZoom(e.zoom < DOT_ZOOM_THRESHOLD);
          onCameraIdle?.({
            lat: e.latitude,
            lng: e.longitude,
            bounds: e.region
              ? {
                  swLat: e.region.latitude,
                  neLat: e.region.latitude + e.region.latitudeDelta,
                  swLng: e.region.longitude,
                  neLng: e.region.longitude + e.region.longitudeDelta,
                }
              : undefined,
          });
        }}
        // SDK 기본 UI는 전부 true라 지정하지 않으면 다 켜진다. 줌(+/-)·현위치 버튼 등 전부 끄고
        // 앱 커스텀 UI(CurrentLocationButton)만 사용 — 줌 버튼 삭제 요청(QA) 반영.
        isShowZoomControls={false}
        isShowLocationButton={false}
        isShowCompass={false}
        // 스케일바(축척)만 예외로 켠다 — 네이버 지도처럼 "지금 보이는 범위가 몇 m인지" 감을 준다.
        // SDK가 현재 줌 + 화면 위도로 미터/픽셀을 계산해 그리므로 우리가 계산할 값은 없다.
        isShowScaleBar
        isShowIndoorLevelPicker={false}
        // 콘텐츠 패딩 — SDK는 컨트롤·로고를 이 영역 안으로 옮긴다. 없으면 지도 뷰(absoluteFill)
        // 최하단에 밀착해 바텀시트 뒤로 완전히 가려진다(네이버 로고는 노출 필수).
        mapPadding={{ top: topPadding ?? 0, bottom: bottomPadding ?? 0 }}
        // 내 위치 = SDK 전용 오버레이(지도당 1개). anchor 기본 중앙 — 점형 마커에 적합.
        locationOverlay={{
          isVisible: myLocation != null,
          ...(myLocation
            ? { position: { latitude: myLocation.lat, longitude: myLocation.lng } }
            : {}),
          image: MY_LOCATION,
          imageWidth: 32,
          imageHeight: 32,
        }}
      >
        {focusedPin && (
          <NaverMapMarkerOverlay
            latitude={focusedPin.lat}
            longitude={focusedPin.lng}
            width={48}
            height={48}
            image={PIN_FOCUSED}
            zIndex={10}
            onTap={() => onMarkerPress(focusedPin.id)}
          />
        )}
      </NaverMapView>
    );
  },
);

HomeMap.displayName = 'HomeMap';
