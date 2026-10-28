import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { track } from '@/shared/lib/analytics';
import { onShellEvent } from '@/shell/bridgeClient';
import { ShellInsets } from '@/shell/ShellInsets';
import { usePushSetup } from '@/shared/domain/notification/push';
import { queryClient } from '@/shared/lib/queryClient';

// 하단 탭바 없음 → 루트 스택. '/' 진입은 app/index.tsx가 splash로 보낸다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 웹 화면 전용 루트(네이티브 앱은 index.native.tsx → 웹뷰 셸). 푸시 등록은 셸 안의 웹이 셸에 토큰을 받아 한다.
  usePushSetup({ enabled: true });

  // 웹뷰 셸 안의 웹: 앱이 켜진 상태에서 알림을 누르면 셸이 이동할 화면을 알려준다.
  useEffect(() => onShellEvent('navigate', (msg) => {
    if (msg.kind === 'event' && msg.event === 'navigate') router.push(msg.path as never);
  }), []);

  // GA4 화면 추적: 라우트 변경 시 screen_view 전송 (Firebase Analytics, 가드 통과)
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
