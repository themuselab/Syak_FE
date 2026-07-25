import {
  type MapImageProp,
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MarkerKind, ShopCardView } from '../shopToView';

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

// 초기 카메라 = 서울 중심 (백엔드 region 항상 "서울").
const SEOUL = { latitude: 37.5665, longitude: 126.978, zoom: 12 };

export type HomeMapRef = { moveTo: (lat: number, lng: number) => void };

type Props = {
  shops: ShopCardView[];
  onMarkerPress: (id: string) => void;
  onMapPress?: () => void; // 핀 없는 빈 곳 탭 (포커스 해제)
  myLocation?: { lat: number; lng: number } | null; // 내 주변 모드의 토글 시점 좌표 (null = 마커 숨김)
  selectedShopId?: string | null; // 포커스된 매장 — 해당 핀만 포커스 핀(56px)으로 교체
  topPadding?: number; // 헤더+검색바 높이 — SDK 컨트롤이 그 아래에 오도록
  bottomPadding?: number; // 바텀시트 최소 높이 — 줌 컨트롤·네이버 로고가 시트에 안 가리게
};

// 네이버 지도 + 샵 좌표 핀. 네이티브 전용(web/Expo Go는 HomeMap.web.tsx placeholder).
// 키(EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) 미발급 dev build에서도 안전하게 placeholder로 폴백.
export const HomeMap = forwardRef<HomeMapRef, Props>(
  (
    { shops, onMarkerPress, onMapPress, myLocation, selectedShopId, topPadding, bottomPadding },
    ref,
  ) => {
    const mapRef = useRef<NaverMapViewRef>(null);

    useImperativeHandle(ref, () => ({
      moveTo: (lat, lng) =>
        mapRef.current?.animateCameraTo({ latitude: lat, longitude: lng, zoom: 14 }),
    }));

    if (!process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) {
      return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e9edf1' }]} />;
    }

    return (
      <NaverMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCamera={SEOUL}
        onTapMap={onMapPress}
        // SDK 기본 UI는 전부 true라 지정하지 않으면 다 켜진다. 줌(+/-)만 남기고 정리:
        // 현위치 버튼은 앱 커스텀 CurrentLocationButton과 중복, 나머지는 디자인에 없다(QA #55).
        isShowZoomControls
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
        {shops
          .filter((s) => s.lat != null && s.lng != null)
          .map((s) => {
            const focused = s.id === selectedShopId;
            return (
              <NaverMapMarkerOverlay
                key={s.id}
                latitude={s.lat!}
                longitude={s.lng!}
                width={focused ? 56 : 34}
                height={focused ? 56 : 42}
                image={focused ? PIN_FOCUSED : PIN[s.markerKind]}
                zIndex={focused ? 1 : 0} // 포커스 핀이 주변 핀에 가려지지 않게
                onTap={() => onMarkerPress(s.id)}
              />
            );
          })}
      </NaverMapView>
    );
  },
);

HomeMap.displayName = 'HomeMap';
