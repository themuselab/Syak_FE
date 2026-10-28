import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDeviceId } from '@/shared/lib/deviceId';

// 셸(네이티브)이 쓰는 푸시 부분만 따로 둔다. push.ts는 expo-router를 쓰는데, 네이티브 앱은 셸 전용
// 진입점(index.native.tsx)이라 라우터·화면을 번들에 넣지 않는다 — 여기서 그걸 끌어오지 않게 분리.

// 포그라운드 수신 시에도 배너/사운드 표시.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
  ?.projectId;

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// 권한 요청 + Expo 푸시 토큰. 거부·미설정(iOS 엔타이틀먼트 전)·실패 시 null(조용히 통과).
export async function getNativeExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    if (!(await ensurePermission())) return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (__DEV__) console.log('[push] Expo token:', data);
    return data;
  } catch (e) {
    console.warn('[push] 토큰 발급 실패(가드 통과)', (e as Error)?.message ?? e);
    return null;
  }
}

// 웹뷰 셸(네이티브)이 웹에 넘겨줄 토큰·설치 ID. 웹이 이걸로 서버 등록을 한다.
export async function getPushTokenForShell(): Promise<{ token: string; deviceId: string } | null> {
  const token = await getNativeExpoPushToken();
  if (!token) return null;
  return { token, deviceId: await getDeviceId() };
}

// 백엔드 알림 data → 이동할 웹 경로(셸이 알림 탭 처리에 쓴다). 샵 정보가 없으면 null.
export function pathFromNotificationData(data: unknown): string | null {
  const shopId = (data as { shopId?: unknown } | undefined)?.shopId;
  return typeof shopId === 'string' && shopId ? `/shop/${shopId}` : null;
}
