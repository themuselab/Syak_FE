import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { OnboardingBackground } from './components/OnboardingBackground';
import { SyakLogo } from './components/SyakLogo';

// 첫 진입 로딩(스플래시) 화면. 디자인: designs/온보딩/온보딩.png
export function SplashScreen() {
  useEffect(() => {
    // TODO(백엔드): /users/me 세션 확인 → 로그인 상태면 '/home', 아니면 '/login'.
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingBackground>
      <View className="flex-1 items-center justify-center gap-4">
        <SyakLogo width={220} height={88} />
        <Text className="text-heading-xl font-pretendard-semibold" style={{ color: '#d46b8b' }}>
          대기 예약은 syak에서 샥!
        </Text>
      </View>
    </OnboardingBackground>
  );
}
