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
import { WebViewShell } from '@/shell/WebViewShell';
import { useWebViewShellUrl } from '@/shell/useWebViewShell';
import { usePushSetup } from '@/shared/domain/notification/push';
import { queryClient } from '@/shared/lib/queryClient';

// 하단 탭바 없음 → 루트 스택. '/' 진입은 app/index.tsx가 splash로 보낸다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 웹뷰 셸 모드 여부. 웹 빌드와 EXPO_PUBLIC_WEBVIEW_URL 미설정 네이티브 빌드는 null →
  // 아래 네이티브 화면(Stack)을 그대로 쓴다(= 롤백 스위치). docs/webview-migration.md
  const shellUrl = useWebViewShellUrl();
  // 푸시: 토큰 발급·서버 등록·알림 탭 처리. 셸 모드의 네이티브 쪽에선 끈다 — 보여줄 네이티브 화면이
  // 없고, 등록은 셸 안의 웹이, 알림 탭·수신은 WebViewShell이 맡는다.
  usePushSetup({ enabled: !shellUrl });

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

  // 앱이 마운트되면 네이티브 스플래시를 즉시 해제 + 카카오 SDK 초기화.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    // 카카오 SDK 초기화(1회). 네이티브 모듈이라 dev build에서만 동작 —
    // dynamic import로 web/Expo Go 번들에 영향을 주지 않고, 없는 환경에선 조용히 통과.
    const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
    if (kakaoKey) {
      import('@react-native-kakao/core')
        .then((m) => m.initializeKakaoSDK(kakaoKey))
        // 삼키면 초기화 실패가 흔적 없이 사라지고, 나중에 로그인 버튼에서만 뭉뚱그려 나타난다.
        // 앱을 깨뜨리진 않되(가드 유지) 로그는 남긴다 (QA 3차).
        .catch((e) => console.warn('[auth] kakao SDK init failed', e));
    }

    // 네이버 SDK 초기화(1회). 카카오와 동일한 dynamic import 가드. 키 없으면 통과.
    // 카카오와 달리 consumerSecret까지 필요(네이버 SDK 요구 — .env로 주입).
    const naverKey = process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY;
    if (naverKey) {
      import('@react-native-seoul/naver-login')
        .then((m) =>
          m.default.initialize({
            consumerKey: naverKey,
            consumerSecret: process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET ?? '',
            appName: process.env.EXPO_PUBLIC_NAVER_APP_NAME ?? 'syak',
            serviceUrlSchemeIOS: process.env.EXPO_PUBLIC_NAVER_URL_SCHEME,
            // false = 네이버 앱이 설치돼 있으면 앱으로 전환해 로그인(app-to-app), 없으면 웹뷰 폴백.
            // 웹뷰에서 아이디·비번을 직접 입력하던 UX 개선(플러그인이 LSApplicationQueriesSchemes에
            // naversearchapp·naversearchthirdlogin을 주입하므로 앱 탐지·전환 가능).
            disableNaverAppAuthIOS: false,
          }),
        )
        .catch((e) => console.warn('[auth] naver SDK init failed', e));
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* initialMetrics 없으면 첫 프레임 insets가 0으로 들어와, 나중에 뜨는 gorhom 시트/리스트가
          하단 내비바에 잘린다(QA #12·#18). initialWindowMetrics로 첫 프레임부터 올바른 인셋 제공. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          {/* 셸 모드: 화면은 웹이 그리고 앱은 푸시·위치·소셜 로그인만 맡는다.
              usePushSetup 등 위의 네이티브 설정은 셸 모드에서도 그대로 돈다. */}
          {shellUrl ? (
            <WebViewShell url={shellUrl} />
          ) : (
            <ShellInsets>
              <Stack screenOptions={{ headerShown: false }} />
            </ShellInsets>
          )}
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
