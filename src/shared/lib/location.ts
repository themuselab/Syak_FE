import * as Location from 'expo-location';

// 위치 권한 요청 + 현재 좌표. 거부·실패 시 null (안내는 호출부가 처리).
// 사용처: 홈 현재위치 버튼, 마이페이지 내 주변 알림(nearLat/nearLng 전송).
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
