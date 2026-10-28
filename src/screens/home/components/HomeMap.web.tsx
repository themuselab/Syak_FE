import { Asset } from 'expo-asset';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapBounds } from '@/shared/domain/shops/shops.types';
import { colors } from '@/shared/theme/colors';

import type { MapPinView, MarkerKind } from '../shopToView';

// 네이버 지도 JS SDK는 런타임 글로벌이라 타입이 없다. 웹 레포(MapViewNaver.tsx)와 동일 전략.
type NaverAny = any;

// 웹 지도 인증 키. 네이티브(EXPO_PUBLIC_NAVER_MAP_CLIENT_ID)와 별개로 NCP에 "Web Dynamic Map"
// 서비스가 등록돼 있어야 하고, 호출 도메인이 콘솔에 등록돼 있어야 한다(미등록 시 인증 실패).
// 기본값은 웹 레포가 쓰는 공개 클라이언트 ID.
const MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_WEB_CLIENT_ID ?? 'uiofwf1jlv';
// 신규 NCP 콘솔은 ncpKeyId, 구(클래식) 콘솔은 ncpClientId. 인증 에러가 뜨면 이 값을 바꾼다.
const AUTH_PARAM = 'ncpKeyId';

// 웹에서 require(png)는 URI가 아니라 에셋 레지스트리 ID(숫자)를 돌려준다. 그래서 그대로 쓰면
// 마커 배경이 빈 문자열이 돼 핀이 안 보인다. expo-asset이 플랫폼 상관없이 URI로 바꿔준다.
// (react-native-web의 Image에는 resolveAssetSource가 없어서 그걸 쓰면 모듈 로드 중 터진다)
function assetUri(mod: number): string {
  return Asset.fromModule(mod).uri;
}

// 네이티브(HomeMap.tsx)와 같은 핀 에셋·크기·줌 기준을 쓴다. 한쪽만 바뀌면 플랫폼마다 지도가 달라진다.
const PIN_SRC: Record<MarkerKind, string> = {
  default: assetUri(require('../../../../assets/icons/pin-default.png')),
  discount: assetUri(require('../../../../assets/icons/pin-discount.png')),
  reservable: assetUri(require('../../../../assets/icons/pin-reservable.png')),
};
const DOT_SRC: Record<MarkerKind, string> = {
  default: assetUri(require('../../../../assets/icons/dot-default.png')),
  discount: assetUri(require('../../../../assets/icons/dot-discount.png')),
  reservable: assetUri(require('../../../../assets/icons/dot-reservable.png')),
};
const FOCUSED_SRC = assetUri(require('../../../../assets/icons/pin-focused.png'));
const MY_LOCATION_SRC = assetUri(require('../../../../assets/icons/marker-my-location.png'));

const PIN_SIZE = { width: 24, height: 30 };
const DOT_SIZE = { width: 12, height: 12 };
const FOCUSED_SIZE = { width: 48, height: 48 };
// 스케일바가 "500m"를 가리키는 지점(서울 위도 기준 zoom≈13.8) 아래로 축소하면 도트로 바꾼다.
const DOT_ZOOM_THRESHOLD = 13.8;

// 초기 카메라 = 강남역 (위치 미동의 시 기본 중심 — 네이티브와 동일).
const GANGNAM = { lat: 37.4979, lng: 127.0276, zoom: 14 };

export type HomeMapRef = { moveTo: (lat: number, lng: number) => void };

type Props = {
  pins: MapPinView[];
  onMarkerPress: (id: string) => void;
  onMapPress?: () => void;
  myLocation?: { lat: number; lng: number } | null;
  onCameraIdle?: (e: { lat: number; lng: number; bounds?: MapBounds }) => void;
  selectedShopId?: string | null;
  topPadding?: number;
  bottomPadding?: number;
};

// SDK는 한 번만 로드한다(화면 재진입마다 <script>를 또 붙이지 않게).
let loadPromise: Promise<void> | null = null;
function loadNaverMaps(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    const w = window as NaverAny;
    if (w.naver?.maps) return resolve();
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${AUTH_PARAM}=${MAP_CLIENT_ID}`;
    script.async = true;
    const timer = window.setTimeout(() => reject(new Error('naver maps load timeout')), 10000);
    script.onload = () => {
      window.clearTimeout(timer);
      if (w.naver?.maps) resolve();
      else reject(new Error('naver.maps missing after load'));
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('naver maps script error'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

// 스플래시(최소 1.2초 표시) 동안 지도 SDK를 미리 받아 둔다. 홈이 마운트된 뒤에야 받기 시작하면
// 스플래시 → 홈 → SDK 다운로드 → 지도 순으로 직렬이 된다. 실패는 HomeMap이 다시 처리하므로 무시.
export function preloadHomeMap(): void {
  loadNaverMaps().catch(() => {});
}

function icon(url: string, size: { width: number; height: number }): NaverAny {
  const w = window as NaverAny;
  return {
    url,
    size: new w.naver.maps.Size(size.width, size.height),
    scaledSize: new w.naver.maps.Size(size.width, size.height),
    // 물방울 핀은 아래 꼭짓점이 좌표, 도트·포커스는 중앙이 좌표(네이티브 앵커와 맞춤).
    anchor: new w.naver.maps.Point(size.width / 2, size.height === size.width ? size.height / 2 : size.height),
  };
}

// 네이버 SDK 호출 가드. SDK 내부 예외가 그대로 effect 밖으로 새면 React가 루트 트리를 통째로
// 내려 앱 전체가 백지가 된다 — 지도 인증 실패 상태(미등록 도메인)에서 핀을 갱신하다 실제로
// 그렇게 터졌다. 지도는 부가 기능이므로 실패해도 목록·검색은 살아 있어야 한다.
function safe(label: string, fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.warn(`[home] naver map ${label} failed`, e);
  }
}

// 웹(웹뷰 포함)용 네이버 지도. 네이티브 HomeMap.tsx와 props·동작을 맞춘다.
// 네이티브와 다른 점: 클러스터링이 없다(네이버 공식 MarkerClustering은 별도 소스가 필요).
// 목록이 60개로 제한돼 있어 당장은 핀이 겹쳐도 읽히지만, 필요해지면 그때 붙인다.
export const HomeMap = forwardRef<HomeMapRef, Props>(
  (
    { pins, onMarkerPress, onMapPress, myLocation, onCameraIdle, selectedShopId, topPadding, bottomPadding },
    ref,
  ) => {
    const containerRef = useRef<NaverAny>(null);
    const mapRef = useRef<NaverAny>(null);
    const markersRef = useRef<Map<string, NaverAny>>(new Map());
    const myMarkerRef = useRef<NaverAny>(null);
    const [ready, setReady] = useState(false);
    const [isDotZoom, setIsDotZoom] = useState(false);

    // 최신 콜백을 ref로 들고 있어야 지도 이벤트 리스너를 매번 떼었다 붙이지 않는다.
    const handlersRef = useRef({ onMarkerPress, onMapPress, onCameraIdle });
    handlersRef.current = { onMarkerPress, onMapPress, onCameraIdle };

    useImperativeHandle(ref, () => ({
      moveTo: (lat, lng) => {
        const w = window as NaverAny;
        if (mapRef.current) safe('morph', () => mapRef.current.morph(new w.naver.maps.LatLng(lat, lng), 14));
      },
    }));

    // 지도 생성 (1회)
    useEffect(() => {
      let alive = true;
      loadNaverMaps()
        .then(() => safe('init', () => {
          if (!alive || !containerRef.current || mapRef.current) return;
          const w = window as NaverAny;
          const map = new w.naver.maps.Map(containerRef.current, {
            center: new w.naver.maps.LatLng(GANGNAM.lat, GANGNAM.lng),
            zoom: GANGNAM.zoom,
            // 네이티브와 동일: 기본 컨트롤은 끄고 스케일바만 켠다(네이버 로고는 필수라 유지).
            zoomControl: false,
            logoControl: true,
            mapDataControl: false,
            scaleControl: true,
          });
          mapRef.current = map;

          w.naver.maps.Event.addListener(map, 'click', () => handlersRef.current.onMapPress?.());
          w.naver.maps.Event.addListener(map, 'idle', () => {
            const c = map.getCenter();
            const b = map.getBounds();
            setIsDotZoom(map.getZoom() < DOT_ZOOM_THRESHOLD);
            handlersRef.current.onCameraIdle?.({
              lat: c.lat(),
              lng: c.lng(),
              bounds: b
                ? {
                    swLat: b.getSW().lat(),
                    swLng: b.getSW().lng(),
                    neLat: b.getNE().lat(),
                    neLng: b.getNE().lng(),
                  }
                : undefined,
            });
          });
          setReady(true);
        }))
        .catch((e) => console.warn('[home] naver map load failed', e));
      return () => {
        alive = false;
      };
    }, []);

    // 콘텐츠 패딩 — 헤더/바텀시트에 지도 컨트롤·로고가 가리지 않게(네이티브 mapPadding과 같은 역할).
    useEffect(() => {
      if (mapRef.current) {
        safe('padding', () =>
          mapRef.current.setOptions({ padding: { top: topPadding ?? 0, bottom: bottomPadding ?? 0 } }),
        );
      }
    }, [ready, topPadding, bottomPadding]);

    // 핀 동기화 — id 기준 diff. 매번 전부 지우고 다시 만들면 지도가 깜빡인다.
    const syncMarkers = useCallback(() => {
      const w = window as NaverAny;
      const map = mapRef.current;
      if (!map) return;
      const alive = new Set(pins.map((p) => p.id));

      for (const [id, marker] of markersRef.current) {
        if (!alive.has(id)) {
          marker.setMap(null);
          markersRef.current.delete(id);
        }
      }

      for (const p of pins) {
        const focused = p.id === selectedShopId;
        const src = focused ? FOCUSED_SRC : isDotZoom ? DOT_SRC[p.markerKind] : PIN_SRC[p.markerKind];
        const size = focused ? FOCUSED_SIZE : isDotZoom ? DOT_SIZE : PIN_SIZE;
        const existing = markersRef.current.get(p.id);
        if (existing) {
          existing.setPosition(new w.naver.maps.LatLng(p.lat, p.lng));
          existing.setIcon(icon(src, size));
          existing.setZIndex(focused ? 10 : 1);
          continue;
        }
        const marker = new w.naver.maps.Marker({
          map,
          position: new w.naver.maps.LatLng(p.lat, p.lng),
          icon: icon(src, size),
          zIndex: focused ? 10 : 1,
        });
        w.naver.maps.Event.addListener(marker, 'click', () => handlersRef.current.onMarkerPress(p.id));
        markersRef.current.set(p.id, marker);
      }
    }, [pins, selectedShopId, isDotZoom]);

    useEffect(() => {
      if (ready) safe('markers', syncMarkers);
    }, [ready, syncMarkers]);

    // 내 위치 점
    useEffect(() => safe('my-location', () => {
      const w = window as NaverAny;
      const map = mapRef.current;
      if (!map) return;
      if (!myLocation) {
        myMarkerRef.current?.setMap(null);
        myMarkerRef.current = null;
        return;
      }
      const pos = new w.naver.maps.LatLng(myLocation.lat, myLocation.lng);
      if (myMarkerRef.current) myMarkerRef.current.setPosition(pos);
      else {
        myMarkerRef.current = new w.naver.maps.Marker({
          map,
          position: pos,
          icon: icon(MY_LOCATION_SRC, { width: 32, height: 32 }),
          zIndex: 5,
        });
      }
    }), [ready, myLocation]);

    // 언마운트 시 마커 정리 (지도 인스턴스는 컨테이너와 함께 사라진다)
    useEffect(
      () => () =>
        safe('cleanup', () => {
          for (const m of markersRef.current.values()) m.setMap(null);
          markersRef.current.clear();
          myMarkerRef.current?.setMap(null);
        }),
      [],
    );

    // react-native-web에서 View의 ref는 실제 DOM 엘리먼트라 그대로 지도 컨테이너로 쓴다.
    // ★ 컨테이너를 absoluteFill로 직접 채우면 안 된다 — 네이버 SDK가 Map 생성 시 컨테이너의
    //   position을 relative로 덮어쓰는데, 그러면 absoluteFill의 top/bottom:0이 "늘리기"가
    //   아니라 "이동"이 돼 높이가 0으로 접힌다(지도 DOM은 다 만들어지는데 화면엔 아무것도 안 보임).
    //   그래서 바깥을 absoluteFill로 잡고, 안쪽 컨테이너는 flex로 채운다.
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface.map }]}>
        <View ref={containerRef} style={{ flex: 1, width: '100%', height: '100%' }} />
      </View>
    );
  },
);

HomeMap.displayName = 'HomeMap';
