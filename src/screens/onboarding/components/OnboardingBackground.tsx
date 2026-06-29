import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

// 온보딩 공통 배경 (디자인 파스텔 그라데이션 이미지).
const bgSource = require('../../../../assets/images/onboarding-bg.png');

type Props = { children: ReactNode };

export function OnboardingBackground({ children }: Props) {
  return (
    <View className="flex-1 bg-white">
      <Image source={bgSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      {children}
    </View>
  );
}
