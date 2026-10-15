import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

// 온보딩 공통 배경 — 위에서 아래로 진해지는 핑크 그라데이션(디자이너 시안 2026-10-15).
// 이전 PNG 배경(onboarding-bg.png)은 기기 비율마다 잘려서 그라데이션으로 교체했다.
// 값은 시안에서 추출: 상단 #F8ADC7 → 하단 #D6426F.
const GRADIENT = ['#f8adc7', '#f1709a', '#d6426f'] as const;

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
