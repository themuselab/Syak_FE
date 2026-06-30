import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { getMe } from '@/shared/domain/user/user.api';

import { OnboardingBackground } from './components/OnboardingBackground';
import { SyakLogo } from './components/SyakLogo';

// 첫 진입 로딩(스플래시) 화면. 디자인: designs/온보딩/온보딩.png
// 세션 확인: GET /users/me 성공 → 로그인 상태(setUser) → /home, 실패(401 등) → /login.
export function SplashScreen() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let cancelled = false;
    // 최소 표시시간(브랜드 로딩) — 세션 확인이 빨라도 깜빡임 없이 잠깐 보여준다.
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 1200));

    (async () => {
      let dest: '/home' | '/login' = '/login';
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser({ id: me.id, nickname: me.nickname, profileImage: me.profileImage });
          dest = '/home';
        }
      } catch {
        dest = '/login'; // 비로그인/세션 없음
      }
      await minDelay;
      if (!cancelled) router.replace(dest);
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

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
