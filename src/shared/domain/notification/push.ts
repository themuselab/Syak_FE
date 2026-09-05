import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { getDeviceId } from '@/shared/lib/deviceId';
import { queryClient } from '@/shared/lib/queryClient';

import { getAppNewsEnabled } from './appNewsLocal';
import { registerDevice, updateNotificationSettings } from './notification.api';

// 푸시 = expo-notifications + Expo Push. (RNFirebase는 Expo54/RN0.81 iOS 빌드 불가 → 전환)
// 발급 토큰 = Expo Push Token("ExponentPushToken[...]") → 백엔드가 Expo Push API로 발송한다.
// 백엔드 저장 필드는 기존 fcm_token 재사용(값만 Expo 토큰). 발송 트리거는 서버(슬롯/앱소식).
//
// iOS는 aps-environment 엔타이틀먼트 + 푸시 활성 프로비저닝 프로파일이 있어야 토큰이 발급된다.
// (Apple: App ID Push capability + APNs .p8 EAS 업로드 + 프로파일 재생성 — 준비 전엔 iOS 토큰 실패,
//  catch로 조용히 통과. Android는 google-services + EAS FCM 자격증명으로 동작.)

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

// 백엔드 알림 data payload: { shopId, slotDate, slotTime } (DispatchSlotNotificationsUseCase).
function openShopFromData(data: unknown): void {
  const shopId = (data as { shopId?: unknown } | undefined)?.shopId;
  if (typeof shopId === 'string' && shopId) router.push(`/shop/${shopId}`);
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// 권한 요청 + Expo 푸시 토큰. 거부·미설정(iOS 엔타이틀먼트 전)·실패 시 null(조용히 통과).
async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    if (!(await ensurePermission())) return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (__DEV__) console.log('[push] Expo token:', data);
    return data;
  } catch (e) {
    console.warn('[push] 토큰 발급 실패(가드 통과)', (e as Error)?.message ?? e);
    return null;
  }
}

// 로그인 후: 토큰 발급 → 유저 설정에 저장(PATCH /notifications/settings).
export async function registerPushToken(): Promise<void> {
  const token = await getPushToken();
  if (token) await updateNotificationSettings({ fcmToken: token });
}

// deviceId + 로컬 appNewsEnabled로 디바이스 업서트(POST /notifications/devices).
async function registerDeviceWithToken(token: string): Promise<void> {
  const [deviceId, appNewsEnabled] = await Promise.all([getDeviceId(), getAppNewsEnabled()]);
  await registerDevice({ deviceId, fcmToken: token, platform: Platform.OS, appNewsEnabled });
}

// 앱 실행 시(로그인 무관): 디바이스 등록 → 비로그인도 앱 소식 푸시 수신.
export async function registerDeviceForAppNews(): Promise<void> {
  const token = await getPushToken();
  if (token) await registerDeviceWithToken(token);
}

// 로그아웃 시: Expo Push는 토큰 무효화 API가 없음 — 서버 토큰은 그대로 두고 발송 실패는 서버가 무시.
export async function unregisterPushToken(): Promise<void> {}

// 루트 레이아웃에서 호출.
// ① 앱 시작 시 디바이스 등록 + 수신/탭 리스너 1회. ② 로그인 전환 시 유저 토큰 등록.
export function usePushSetup(): void {
  const user = useAuthStore((s) => s.user);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    registerDeviceForAppNews();
    // 포그라운드 수신 → 알림 목록 캐시 갱신
    const recv = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'app-news'] });
    });
    // 알림 탭 → 샵 상세
    const resp = Notifications.addNotificationResponseReceivedListener((r) =>
      openShopFromData(r.notification.request.content.data),
    );
    // 종료 상태에서 알림 탭 콜드스타트 → 스플래시 replace와 경합 피해 잠시 뒤 이동
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) setTimeout(() => openShopFromData(r.notification.request.content.data), 500);
    });
    return () => {
      recv.remove();
      resp.remove();
    };
  }, []);

  useEffect(() => {
    const id = user?.id ?? null;
    if (id && prevIdRef.current !== id) registerPushToken();
    prevIdRef.current = id;
  }, [user]);
}
