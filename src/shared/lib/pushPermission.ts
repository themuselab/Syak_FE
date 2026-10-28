import { Linking, Platform } from 'react-native';

import { callShell, inShell } from '@/shell/bridgeClient';

// OS 푸시 알림 권한. 마이페이지 "알림" 토글이 이 값을 보여준다(위치 권한 토글과 같은 패턴).
// 웹(= 웹뷰 안 화면)에는 네이티브 알림 모듈이 없어 항상 꺼짐으로 취급한다 — 웹뷰 전환 후엔
// 네이티브 셸이 브리지로 실제 권한을 알려줘야 한다(docs/webview-migration.md 브리지 목록).

export async function getPushPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  // 웹뷰 셸 안이면 셸이 실제 OS 권한을 알려준다(위 주석의 "브리지" — 구현됨).
  if (inShell()) return callShell({ type: 'getPushPermission' }).catch(() => ({ granted: false, canAskAgain: false }));
  if (Platform.OS === 'web') return { granted: false, canAskAgain: false };
  try {
    // 네이티브 전용 모듈 — 동적 import로 웹 첫 번들에서 뺀다(웹은 위에서 이미 반환).
    const { getNativePushPermission } = await import('@/shared/lib/nativeNotifications');
    return await getNativePushPermission();
  } catch {
    return { granted: false, canAskAgain: false };
  }
}

// 켜기: 물어볼 수 있으면 OS 팝업, 이미 거부했으면 설정 앱. 끄기: 앱에서 회수할 수 없어 설정 앱.
// 반환값 = 지금 켜져 있는지(설정 앱으로 보낸 경우엔 돌아와서 다시 조회해야 정확하다).
export async function togglePushPermission(next: boolean): Promise<boolean> {
  if (inShell()) return callShell({ type: 'togglePushPermission', next }).catch(() => false);
  if (Platform.OS === 'web') return false;
  if (!next) {
    await Linking.openSettings().catch(() => {});
    return (await getPushPermission()).granted;
  }
  const { granted, canAskAgain } = await getPushPermission();
  if (granted) return true;
  if (!canAskAgain) {
    await Linking.openSettings().catch(() => {});
    return false;
  }
  try {
    const { requestNativePushPermission } = await import('@/shared/lib/nativeNotifications');
    return await requestNativePushPermission();
  } catch {
    return false;
  }
}
