import {
  type MapImageProp,
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MarkerKind, ShopCardView } from '../shopToView';

// 마커 종류별 핀 PNG (assets/icons/pin-{kind}.png). require(png)는 로컬 리소스 이미지로 전달된다.
const PIN: Record<MarkerKind, MapImageProp> = {
  partner: require('../../../../assets/icons/pin-partner.png') as MapImageProp,
  discount: require('../../../../assets/icons/pin-discount.png') as MapImageProp,
  reservable: require('../../../../assets/icons/pin-reservable.png') as MapImageProp,
};

// 초기 카메라 = 서울 중심 (백엔드 region 항상 "서울").
const SEOUL = { latitude: 37.5665, longitude: 126.978, zoom: 12 };

export type HomeMapRef = { moveTo: (lat: number, lng: number) => void };

type Props = { shops: ShopCardView[]; onMarkerPress: (id: string) => void };

// 네이버 지도 + 샵 좌표 핀. 네이티브 전용(web/Expo Go는 HomeMap.web.tsx placeholder).
// 키(EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) 미발급 dev build에서도 안전하게 placeholder로 폴백.
export const HomeMap = forwardRef<HomeMapRef, Props>(({ shops, onMarkerPress }, ref) => {
  const mapRef = useRef<NaverMapViewRef>(null);

  useImperativeHandle(ref, () => ({
    moveTo: (lat, lng) => mapRef.current?.animateCameraTo({ latitude: lat, longitude: lng, zoom: 14 }),
  }));

  if (!process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e9edf1' }]} />;
  }

  return (
    <NaverMapView ref={mapRef} style={StyleSheet.absoluteFill} initialCamera={SEOUL}>
      {shops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => (
          <NaverMapMarkerOverlay
            key={s.id}
            latitude={s.lat!}
            longitude={s.lng!}
            width={34}
            height={42}
            image={PIN[s.markerKind]}
            onTap={() => onMarkerPress(s.id)}
          />
        ))}
    </NaverMapView>
  );
});

HomeMap.displayName = 'HomeMap';
