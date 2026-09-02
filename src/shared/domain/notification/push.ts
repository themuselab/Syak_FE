// FCM 푸시 — v1에서는 비활성(no-op). @react-native-firebase/messaging이 Expo54/RN0.81 iOS에서
// 빌드 실패해 v1에서는 네이티브 Firebase를 제거했다. 호출부(usePushSetup·registerPushToken 등)는
// 그대로 두되 아무 동작도 하지 않는다. v1.1에서 푸시를 재도입할 때(양 플랫폼 통일, 필요시
// expo-notifications) 이 파일을 되살린다.
// 원래 동작: 로그인 시 FCM 토큰 발급 → 서버 등록(notification_settings/devices), 슬롯·앱소식 알림 수신.

/** 로그인 후 FCM 토큰 등록 — v1 no-op. */
export async function registerPushToken(): Promise<void> {}

/** 앱 실행 시 디바이스 등록(앱 소식용) — v1 no-op. */
export async function registerDeviceForAppNews(): Promise<void> {}

/** 로그아웃 시 토큰 무효화 — v1 no-op. */
export async function unregisterPushToken(): Promise<void> {}

/** 루트 레이아웃에서 호출하는 푸시 셋업 훅 — v1 no-op. */
export function usePushSetup(): void {}
