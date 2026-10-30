import AsyncStorage from '@react-native-async-storage/async-storage';

// "비회원으로 둘러보기"를 한 번 누르면 기억해 두고, 다음 실행부터 로그인 화면 없이 홈으로 보낸다.
// 로그아웃하면 지운다(로그아웃한 사람은 다음에 로그인 화면을 기대).
const KEY = 'syak.guestBrowse';

export async function isGuestBrowse(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export function setGuestBrowse(on: boolean): void {
  (on ? AsyncStorage.setItem(KEY, '1') : AsyncStorage.removeItem(KEY)).catch(() => {});
}
