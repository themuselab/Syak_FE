import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

// 온보딩 공통 배경 — 위에서 아래로 진해지는 핑크 그라데이션(디자이너 시안 2026-10-15).
// 이전 PNG 배경(onboarding-bg.png)은 기기 비율마다 잘려서 그라데이션으로 교체했다.
// 값은 tokens.js onboarding.gradient(시안 추출값).
const GRADIENT = colors.onboarding.gradient as unknown as readonly [string, string, ...string[]];

type Props = { children: ReactNode };

export function OnboardingBackground({ children }: Props) {
  return (
    <View className="flex-1">
      <LinearGradient
        colors={GRADIENT}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
