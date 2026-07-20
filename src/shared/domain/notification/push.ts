import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { getDeviceId } from '@/shared/lib/deviceId';
import { queryClient } from '@/shared/lib/queryClient';

import { getAppNewsEnabled } from './appNewsLocal';
import { registerDevice, updateNotificationSettings } from './notification.api';

// FCM 푸시 토큰 등록 (dev build 전용 — 네이티브 모듈).
// 카카오/네이버 SDK 초기화와 같은 dynamic import 가드 — web·Expo Go·google-services 미포함 구 빌드에선
// import/초기화가 실패하고 catch로 조용히 통과한다(기존 화면 무영향).
// 발송은 전부 백엔드: 슬롯 오픈 시 notification_settings.fcm_token으로 firebase-admin이 쏜다.
// 라이브러리가 expo-notifications가 아닌 이유: iOS에서 APNs 토큰이 아닌 FCM 토큰이 필요(docs/decisions.md).

// 타입 전용 import는 번들에서 지워지므로 web에서도 안전.
type Messaging = typeof import('@react-native-firebase/messaging');
type RemoteMessage = import('@react-native-firebase/messaging').FirebaseMessagingTypes.RemoteMessage;

let listenersAttached = false; // 리스너(토큰 갱신·알림 탭 등)는 앱 프로세스당 1회만

// 백엔드 payload data: { shopId, slotDate, slotTime } (DispatchSlotNotificationsUseCase).
function openShopFromMessage(message: RemoteMessage | null) {
  const shopId = message?.data?.shopId;
  if (typeof shopId === 'string' && shopId) router.push(`/shop/${shopId}`);
}

// 알림 권한. 안드 13+만 런타임 권한(POST_NOTIFICATIONS — app.json permissions에 선언),
// 안드 12 이하는 권한 개념 없음. iOS는 FCM requestPermission(시스템 팝업).
async function requestNotificationPermission(m: Messaging): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Number(Platform.Version) < 33) return true;
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await m.requestPermission(m.getMessaging());
  return (
    status === m.AuthorizationStatus.AUTHORIZED || status === m.AuthorizationStatus.PROVISIONAL
  );
}

// 로그인 후 호출: 권한 요청 → FCM 토큰 발급 → 서버 저장(PATCH /notifications/settings).
// 거부·실패 시 조용히 종료(푸시만 못 받고 앱은 정상 — 알림 목록은 그대로 동작).
export async function registerPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const m: Messaging = await import('@react-native-firebase/messaging');
    const messaging = m.getMessaging();

    if (!(await requestNotificationPermission(m))) return;

    const token = await m.getToken(messaging);
    if (__DEV__) console.log('[push] FCM token:', token); // 실기기 검증용(Firebase 콘솔 테스트 메시지)
    if (token) await updateNotificationSettings({ fcmToken: token });

    if (!listenersAttached) {
      listenersAttached = true;
      // 토큰 로테이션 시 서버 재등록 (best-effort) — 유저 설정(fcmToken) + 디바이스(앱 소식) 둘 다
      m.onTokenRefresh(messaging, (t) => {
        updateNotificationSettings({ fcmToken: t }).catch(() => {});
        registerDeviceWithToken(t).catch(() => {});
      });
      // 포그라운드 수신: OS가 배너를 안 띄우므로(임시 동작 — docs/notification.md) 알림 목록 캐시만 갱신
      m.onMessage(messaging, async () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'app-news'] });
      });
      // 백그라운드에서 알림 탭 → 샵 상세
      m.onNotificationOpenedApp(messaging, openShopFromMessage);
      // 종료 상태에서 알림 탭으로 콜드 스타트 → 스플래시의 replace(/home)와 경합하지 않게 잠시 뒤 push
      m.getInitialNotification(messaging).then((msg) => {
        if (msg) setTimeout(() => openShopFromMessage(msg), 500);
      });
    }
  } catch {
    // 네이티브 모듈/Firebase 설정 없는 환경(web·Expo Go·구 dev build) — 조용히 통과
  }
}

// deviceId + 로컬 appNewsEnabled로 디바이스 업서트 (POST /notifications/devices, 204).
async function registerDeviceWithToken(token: string): Promise<void> {
  const [deviceId, appNewsEnabled] = await Promise.all([getDeviceId(), getAppNewsEnabled()]);
  await registerDevice({ deviceId, fcmToken: token, platform: Platform.OS, appNewsEnabled });
}

// 앱 실행 시 호출(로그인 무관 — docs/09 §3-5): 권한 요청 → FCM 토큰 → 디바이스 등록.
// 이게 있어야 비로그인 유저도 앱 소식 푸시를 받는다(QA 비로그인 #4). 실패 시 조용히 종료.
// 마이 "앱 소식" 토글 변경 시에도 재호출해 appNewsEnabled를 서버에 반영한다.
export async function registerDeviceForAppNews(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const m: Messaging = await import('@react-native-firebase/messaging');
    const messaging = m.getMessaging();
    if (!(await requestNotificationPermission(m))) return;
    const token = await m.getToken(messaging);
    if (token) await registerDeviceWithToken(token);
  } catch {
    // 네이티브 모듈/Firebase 설정 없는 환경(web·Expo Go·구 dev build) — 조용히 통과
  }
}

// 로그아웃 시 호출: 기기 토큰 무효화 — 서버에 남은 토큰으로 발송돼도 전달 안 됨.
// (서버 토큰 삭제 API 없음: PATCH가 COALESCE라 null로 못 지움 — BE 전달사항, docs/notification.md §9)
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const m: Messaging = await import('@react-native-firebase/messaging');
    await m.deleteToken(m.getMessaging());
  } catch {
    // 위와 동일 가드
  }
}

// 루트 레이아웃에서 호출.
// ① 앱 시작 시 디바이스 등록 1회(로그인 무관 — 앱 소식 푸시용, 알림 권한 팝업도 이 시점).
// ② 로그인 전환(스플래시 세션 복원·소셜 로그인) 시 유저 토큰 등록 1회. 계정 변경(id) 시 재등록.
export function usePushSetup() {
  const user = useAuthStore((s) => s.user);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    registerDeviceForAppNews();
  }, []);

  useEffect(() => {
    const id = user?.id ?? null;
    if (id && prevIdRef.current !== id) registerPushToken();
    prevIdRef.current = id;
  }, [user]);
}
