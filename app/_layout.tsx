import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { initAnalytics, track } from '@/shared/lib/analytics';
import { installHardwareBack } from '@/shared/lib/backStack';
import { onShellEvent } from '@/shell/bridgeClient';
import { ShellInsets } from '@/shell/ShellInsets';
import { usePushSetup } from '@/shared/domain/notification/push';
import { markNotificationOpened } from '@/shared/domain/notification/notification.api';
import { queryClient } from '@/shared/lib/queryClient';

// 하단 탭바 없음 → 루트 스택. '/' 진입은 app/index.tsx가 splash로 보낸다.
SplashScreen.preventAutoHideAsync();

function handlePushOpen(path: string) {
  track.pushOpened(path);
  const nid = new URLSearchParams(path.split('?')[1] ?? '').get('nid');
  if (nid) markNotificationOpened(nid).catch(() => {}); // 비로그인·만료면 조용히 실패
}

export default function RootLayout() {
  // 웹 화면 전용 루트(네이티브 앱은 index.native.tsx → 웹뷰 셸). 푸시 등록은 셸 안의 웹이 셸에 토큰을 받아 한다.
  usePushSetup({ enabled: true });

  // 웹뷰 셸 안의 웹: 앱이 켜진 상태에서 알림을 누르면 셸이 이동할 화면을 알려준다.
  // 푸시로 열림: 앱이 켜진 상태의 탭은 셸 navigate 이벤트, 꺼져 있다 켜지면 셸이 ?from=push 주소로 바로 연다.
  // 둘 다 GA push_opened + 서버 열람 기록(nid). 예전 셸(쿼리 없음)은 navigate만 잡힌다.
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'push') {
      handlePushOpen(window.location.pathname + window.location.search);
    }
    return onShellEvent('navigate', (msg) => {
      if (msg.kind !== 'event' || msg.event !== 'navigate') return;
      handlePushOpen(msg.path);
      router.push(msg.path as never);
    });
  }, []);

  // GA4: anonymous_id·user_id 동기화, 셸 첫 실행(app_first_open). 웹 빌드에서만 동작(docs/analytics.md).
  useEffect(() => initAnalytics(), []);

  // 웹뷰 셸 안의 웹: 안드로이드 물리 뒤로가기를 셸이 넘겨준다(열린 모달·시트부터 닫기 — backStack).
  useEffect(() => installHardwareBack(), []);

  // GA4 화면 추적: 라우트(pathname)가 바뀔 때 주요 화면만 app_screen_view 1회.
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) track.screen(pathname);
  }, [pathname]);

  // 폰트는 백그라운드로 로드한다. 로딩 완료를 기다리느라 화면을 막지 않는다
  // (기다리면 폰에서 네이티브 스플래시에 멈출 수 있어서). 폰트는 준비되는 대로 적용됨.
  useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.ttf'),
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* initialMetrics 없으면 첫 프레임 insets가 0으로 들어와, 나중에 뜨는 gorhom 시트/리스트가
          하단 내비바에 잘린다(QA #12·#18). initialWindowMetrics로 첫 프레임부터 올바른 인셋 제공. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <ShellInsets>
            <Stack screenOptions={{ headerShown: false }} />
          </ShellInsets>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
