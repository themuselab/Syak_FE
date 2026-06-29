import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/shared/lib/queryClient';

// 하단 탭바 없음 → 루트 스택. '/' 진입은 app/index.tsx가 splash로 보낸다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 폰트는 백그라운드로 로드한다. 로딩 완료를 기다리느라 화면을 막지 않는다
  // (기다리면 폰에서 네이티브 스플래시에 멈출 수 있어서). 폰트는 준비되는 대로 적용됨.
  useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.ttf'),
  });

  // 앱이 마운트되면 네이티브 스플래시를 즉시 해제.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
