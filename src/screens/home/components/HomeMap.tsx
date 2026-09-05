import {
  type MapImageProp,
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapBounds } from '@/shared/domain/shops/shops.types';

import type { MapPinView, MarkerKind } from '../shopToView';

// 마커 종류별 핀 PNG (assets/icons/pin-{kind}.png, 96×120 — 투명 여백 크롭본이라 34×42 렌더와 비율 일치).
// require(png)는 로컬 리소스 이미지로 전달된다.
const PIN: Record<MarkerKind, MapImageProp> = {
  partner: require('../../../../assets/icons/pin-partner.png') as MapImageProp,
  discount: require('../../../../assets/icons/pin-discount.png') as MapImageProp,
  reservable: require('../../../../assets/icons/pin-reservable.png') as MapImageProp,
};

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

    useImperativeHandle(ref, () => ({
      moveTo: (lat, lng) =>
        mapRef.current?.animateCameraTo({ latitude: lat, longitude: lng, zoom: 14 }),
    }));

    // 핀은 네이티브 클러스터링으로 렌더(수백 개도 성능·시인성 확보 — 개별 오버레이는 버벅임).
    // 포커스된 샵은 클러스터에서 빼고 별도 오버레이로 항상 위에 크게 표시.
    const clusterMarkers = useMemo(
      () =>
        pins
          .filter((p) => p.id !== selectedShopId)
          .map((p) => ({
            identifier: p.id,
            latitude: p.lat,
            longitude: p.lng,
            image: PIN[p.markerKind],
            width: 34,
            height: 42,
          })),
      [pins, selectedShopId],
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
        // 네이티브 마커 클러스터링(줌 레벨별 근접 핀 묶음). 포커스 핀은 제외(별도 오버레이).
        clusters={[{ animate: true, markers: clusterMarkers }]}
        onTapClusterLeaf={({ markerIdentifier }) => onMarkerPress(markerIdentifier)}
        // 카메라가 멈추면 중심 + 영역(bounds)을 부모로 → 목록은 중심 기준, 핀은 영역 기준(웹 동일).
        // region은 카메라 이벤트의 표시 영역(중심±delta/2)이라 화면에 보이는 사각형과 일치한다.
        onCameraIdle={(e) =>
          onCameraIdle?.({
            lat: e.latitude,
            lng: e.longitude,
            bounds: e.region
              ? {
                  swLat: e.region.latitude - e.region.latitudeDelta / 2,
                  neLat: e.region.latitude + e.region.latitudeDelta / 2,
                  swLng: e.region.longitude - e.region.longitudeDelta / 2,
                  neLng: e.region.longitude + e.region.longitudeDelta / 2,
                }
              : undefined,
          })
        }
        // SDK 기본 UI는 전부 true라 지정하지 않으면 다 켜진다. 줌(+/-)·현위치 버튼 등 전부 끄고
        // 앱 커스텀 UI(CurrentLocationButton)만 사용 — 줌 버튼 삭제 요청(QA) 반영.
        isShowZoomControls={false}
        isShowLocationButton={false}
        isShowCompass={false}
        isShowScaleBar={false}
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
            width={56}
            height={56}
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
