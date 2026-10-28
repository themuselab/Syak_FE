import * as Notifications from 'expo-notifications';

import { getNativeExpoPushToken } from '@/shell/nativePush';

// 네이티브(expo-notifications) 전용 알림 기능. 웹 화면에선 쓰지 않으므로 push.ts·pushPermission.ts가
// 동적 import로만 불러온다 → expo-notifications(+ assert·util 폴리필 등 ~120KB)가 웹 첫 번들에서 빠진다.
// 동적 import 대상이 여러 파일이면 Expo가 공유 모듈을 __common 청크로 묶어 첫 로딩에 같이 받으므로,
// expo-notifications로 가는 비동기 진입점은 이 파일 하나로 모은다.

export function getNativePushToken(): Promise<string | null> {
  return getNativeExpoPushToken();
}

export async function getNativePushPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  return { granted, canAskAgain };
}

export async function requestNativePushPermission(): Promise<boolean> {
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

// 수신·탭 리스너 등록. 반환값 = 해제 함수.
export function subscribeNativePush(handlers: {
  onReceived: () => void;
  onOpen: (data: unknown) => void;
}): () => void {
  // 포그라운드 수신
  const recv = Notifications.addNotificationReceivedListener(() => handlers.onReceived());
  // 알림 탭
  const resp = Notifications.addNotificationResponseReceivedListener((r) =>
    handlers.onOpen(r.notification.request.content.data),
  );
  // 종료 상태에서 알림 탭 콜드스타트 → 스플래시 replace와 경합 피해 잠시 뒤 이동
  Notifications.getLastNotificationResponseAsync().then((r) => {
    if (r) setTimeout(() => handlers.onOpen(r.notification.request.content.data), 500);
  });
  return () => {
    recv.remove();
    resp.remove();
  };
}
