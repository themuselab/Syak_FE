import '../../global.css';

import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { WebViewShell } from './WebViewShell';

// 네이티브 앱의 루트(index.native.tsx). 화면은 전부 웹(Vercel)이 그리고 앱은 웹뷰 셸만 띄운다.
// 예전 네이티브 화면(expo-router 라우트)·폰트·지도 SDK는 네이티브 번들/바이너리에서 뺐다(앱 용량 2026-10-28).
// 되돌리려면 package.json main을 expo-router/entry로, autolinking 제외 목록을 비우면 된다.
const DEFAULT_URL = 'https://app.themuselab.kr';

SplashScreen.preventAutoHideAsync();

// 소셜 로그인 SDK 초기화(1회). 키가 없으면 통과(로그인 시 "준비 중" 안내).
function initSocialSdks() {
  const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  if (kakaoKey) {
    import('@react-native-kakao/core')
      .then((m) => m.initializeKakaoSDK(kakaoKey))
      .catch((e) => console.warn('[auth] kakao SDK init failed', e));
  }
  // 네이버는 consumerSecret까지 필요(네이버 SDK 요구 — EAS 환경변수로 주입).
  const naverKey = process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY;
  if (naverKey) {
    import('@react-native-seoul/naver-login')
      .then((m) =>
        m.default.initialize({
          consumerKey: naverKey,
          consumerSecret: process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET ?? '',
          appName: process.env.EXPO_PUBLIC_NAVER_APP_NAME ?? 'syak',
          serviceUrlSchemeIOS: process.env.EXPO_PUBLIC_NAVER_URL_SCHEME,
          // false = 네이버 앱이 있으면 앱으로 전환해 로그인, 없으면 웹뷰 폴백.
          disableNaverAppAuthIOS: false,
        }),
      )
      .catch((e) => console.warn('[auth] naver SDK init failed', e));
  }
}

export function ShellApp() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    initSocialSdks();
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <WebViewShell url={process.env.EXPO_PUBLIC_WEBVIEW_URL || DEFAULT_URL} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
