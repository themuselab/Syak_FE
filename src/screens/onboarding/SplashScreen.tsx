import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { getMe } from '@/shared/domain/user/user.api';

import { OnboardingBackground } from './components/OnboardingBackground';
import { SyakLogo } from './components/SyakLogo';
import { colors } from '@/shared/theme/colors';

// 첫 진입 로딩(스플래시) 화면. 디자인: 디자이너 시안 2026-10-15(핑크 그라데이션 + 흰 로고).
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
      {/* 로고는 화면 정중앙. 로그인 화면에서는 같은 로고가 위쪽으로 올라간다. */}
      <View className="flex-1 items-center justify-center">
        <SyakLogo size={112} />
        <Text
          className="mt-5 text-body-l font-pretendard-medium"
          style={{ color: colors.white, opacity: 0.9 }}
        >
          뷰티 예약의 새로운 방법, 샥
        </Text>
      </View>
    </OnboardingBackground>
  );
}
