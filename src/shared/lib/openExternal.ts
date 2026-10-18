import { Linking } from 'react-native';

import { callShell, inShell } from '@/shell/bridgeClient';

// 바깥 앱·페이지 열기(네이버 예약, 인스타, 전화, 앱 소식 링크).
// 웹뷰 셸 안에서 웹이 직접 열면 페이지가 웹뷰 안으로 들어와 앱 화면을 덮어버리거나(안드로이드),
// 아예 반응이 없다(iOS window.open). 그래서 셸에 부탁해 네이티브로 연다(네이버 앱·전화 앱 등).
export function openExternal(url: string): void {
  if (inShell()) {
    callShell({ type: 'openExternal', url }).catch(() => {});
    return;
  }
  Linking.openURL(url).catch(() => {});
}

// 앱 설정 화면(권한을 다시 켜야 할 때). 셸 안이면 셸이 연다. 일반 브라우저에선 할 수 없다.
export function openAppSettings(): void {
  if (inShell()) {
    callShell({ type: 'openSettings' }).catch(() => {});
    return;
  }
  Linking.openSettings().catch(() => {});
}
