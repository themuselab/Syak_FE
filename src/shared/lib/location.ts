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

// 위치 권한 요청 + 현재 좌표. 거부·실패 시 null (안내는 호출부가 처리).
// 사용처: 홈 진입 시 1회(카메라 이동), 홈 현재위치 버튼, 마이페이지 내 주변 알림(nearLat/nearLng 전송).
export async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({});
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
