import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { getDeviceId } from '@/shared/lib/deviceId';
import { queryClient } from '@/shared/lib/queryClient';
import { callShell, inShell, onShellEvent } from '@/shell/bridgeClient';

import { getAppNewsEnabled } from './appNewsLocal';
import { registerDevice, updateNotificationSettings } from './notification.api';

// 푸시 = expo-notifications + Expo Push. (RNFirebase는 Expo54/RN0.81 iOS 빌드 불가 → 전환)
// 발급 토큰 = Expo Push Token("ExponentPushToken[...]") → 백엔드가 Expo Push API로 발송한다.
// 백엔드 저장 필드는 기존 fcm_token 재사용(값만 Expo 토큰). 발송 트리거는 서버(슬롯/앱소식).
//
// iOS는 aps-environment 엔타이틀먼트 + 푸시 활성 프로비저닝 프로파일이 있어야 토큰이 발급된다.
// (Apple: App ID Push capability + APNs .p8 EAS 업로드 + 프로파일 재생성 — 준비 전엔 iOS 토큰 실패,
//  catch로 조용히 통과. Android는 google-services + EAS FCM 자격증명으로 동작.)

// 백엔드 알림 data payload: { shopId, slotDate, slotTime } (DispatchSlotNotificationsUseCase).
function openShopFromData(data: unknown): void {
  const shopId = (data as { shopId?: unknown } | undefined)?.shopId;
  if (typeof shopId === 'string' && shopId) router.push(`/shop/${shopId}`);
}

// 웹뷰 셸 안의 웹: 토큰은 셸(네이티브)이 발급하고, 서버 등록은 로그인 쿠키를 가진 웹이 한다.
// deviceId도 셸 것을 쓴다 — 웹 저장소는 지워질 수 있지만 셸의 설치 ID는 앱 삭제 전까지 같다.
let shellDeviceId: string | null = null;

// 권한 요청 + Expo 푸시 토큰. 거부·미설정(iOS 엔타이틀먼트 전)·실패 시 null(조용히 통과).
async function getPushToken(): Promise<string | null> {
  if (inShell()) {
    const r = await callShell({ type: 'getPushToken' }, 30_000).catch(() => null);
    if (r) shellDeviceId = r.deviceId;
    return r?.token ?? null;
  }
  // 웹에선 네이티브 알림 모듈이 필요 없다 — 동적 import로 expo-notifications를 웹 첫 번들에서 뺀다.
  if (Platform.OS === 'web') return null;
  const { getNativePushToken } = await import('@/shared/lib/nativeNotifications');
  return getNativePushToken();
}

// 로그인 후: 토큰 발급 → 유저 설정에 저장(PATCH /notifications/settings).
export async function registerPushToken(): Promise<void> {
  const token = await getPushToken();
  if (token) await updateNotificationSettings({ fcmToken: token });
}

// deviceId + 로컬 appNewsEnabled로 디바이스 업서트(POST /notifications/devices).
async function registerDeviceWithToken(token: string): Promise<void> {
  const [localId, appNewsEnabled] = await Promise.all([getDeviceId(), getAppNewsEnabled()]);
  const deviceId = shellDeviceId ?? localId;
  // 셸 안이면 실제 기기 OS(ios/android)로 등록한다(웹 화면의 Platform.OS는 'web').
  const platform = inShell() ? (globalThis as { __SYAK_SHELL__?: { platform: string } }).__SYAK_SHELL__!.platform : Platform.OS;
  await registerDevice({ deviceId, fcmToken: token, platform, appNewsEnabled });
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
// enabled=false: 웹뷰 셸 모드의 네이티브 쪽. 등록·리스너는 셸 안의 웹과 셸 컴포넌트가 맡는다
// (네이티브 화면이 없으니 여기서 router.push를 해도 갈 곳이 없다).
export function usePushSetup({ enabled = true }: { enabled?: boolean } = {}): void {
  const user = useAuthStore((s) => s.user);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // 웹뷰 셸 안의 웹: 토큰은 셸에서 받아 등록하고, 도착 이벤트만 구독한다(알림 탭 이동은 _layout).
    if (inShell()) {
      registerDeviceForAppNews();
      return onShellEvent('pushReceived', () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'app-news'] });
      });
    }
    // 일반 브라우저: 푸시 없음. (getLastNotificationResponseAsync 등은 웹에서 예외)
    if (Platform.OS === 'web') return;
    registerDeviceForAppNews();
    // expo-notifications는 네이티브에서만 쓰므로 동적 import(웹 첫 번들에서 제외).
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    import('@/shared/lib/nativeNotifications').then(({ subscribeNativePush }) => {
      if (cancelled) return;
      unsubscribe = subscribeNativePush({
        // 포그라운드 수신 → 알림 목록 캐시 갱신
        onReceived: () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'app-news'] });
        },
        // 알림 탭 → 샵 상세
        onOpen: openShopFromData,
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const id = user?.id ?? null;
    if (id && prevIdRef.current !== id) registerPushToken();
    prevIdRef.current = id;
  }, [user, enabled]);
}
