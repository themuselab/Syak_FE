import * as Location from 'expo-location';

// 위치 권한 상태 조회(요청 팝업 없음). 마이페이지 "위치 권한" 토글 표시용(QA 비로그인 #3).
export async function getLocationPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  try {
    const { granted, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return { granted, canAskAgain };
  } catch {
    return { granted: false, canAskAgain: false };
  }
}

// 위치 권한 요청(OS 팝업). 이미 허용이면 즉시 true.
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// 최근 위치를 재사용하는 허용 범위. 주변 샵 검색 반경이 km 단위라 5분 전 좌표로 충분하다.
const LAST_KNOWN_MAX_AGE = 5 * 60 * 1000;

// 위치 권한 요청 + 현재 좌표. 거부·실패 시 null (안내는 호출부가 처리).
// 사용처: 홈 진입 시 1회(카메라 이동), 홈 현재위치 버튼, 마이페이지 내 주변 알림(nearLat/nearLng 전송).
//
// 캐시 좌표 우선(QA #56): getCurrentPositionAsync는 매번 새 GPS fix를 기다려 실내 콜드스타트에서
// 수 초~십수 초가 걸린다. 최근 좌표가 있으면 즉시 반환하고, 없을 때만 새로 측정한다.
// 정확도는 Balanced(≈100m) — 반경 km 단위 검색에 고정밀 fix가 필요 없고 훨씬 빠르다.
export async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const last = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE });
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
