import type { ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useShellInfo } from './bridgeClient';

// 웹뷰 셸 안의 웹 화면에 기기 안전 영역(노치·홈바)을 알려준다.
// 셸은 웹뷰를 화면 끝까지 채운다 — 셸이 상단 여백을 덧대면 스플래시 분홍 위에 흰 띠가 생기고
// 홈 지도도 상태바 아래까지 깔리지 않는다. 대신 셸이 넘겨준 값을 기존 useSafeAreaInsets()가
// 그대로 돌려주게 해서, 화면들은 네이티브 앱 때처럼 각자 여백을 잡는다(화면 코드 수정 없음).
// 웹뷰 안에서는 CSS env(safe-area-inset-*)가 0이라 기본 SafeAreaProvider만으로는 알 수 없다.
export function ShellInsets({ children }: { children: ReactNode }) {
  // 화면이 붙은 뒤 적용(미리 그린 정적 화면과의 하이드레이션 불일치 방지 — useShellInfo 주석)
  const info = useShellInfo();
  if (!info) return <>{children}</>;
  return <SafeAreaInsetsContext.Provider value={info.insets}>{children}</SafeAreaInsetsContext.Provider>;
}
