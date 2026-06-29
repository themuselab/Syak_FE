import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { LoginErrorToast } from './components/LoginErrorToast';
import { OnboardingBackground } from './components/OnboardingBackground';
import { SocialLoginButton } from './components/SocialLoginButton';
import { SyakLogo } from './components/SyakLogo';

const appleIcon = require('../../../assets/icons/social-apple.png');
const kakaoIcon = require('../../../assets/icons/social-kakao.png');
const naverIcon = require('../../../assets/icons/social-naver.png');

// 로그인 화면. 디자인: designs/온보딩/온보딩-1.png (+ 로그인 실패시.png 토스트)
export function LoginScreen() {
  // 로그인 실패 시 노출 (백엔드 연동 단계에서 set). 지금은 항상 false.
  const [errorVisible] = useState(false);

  // TODO(백엔드): 실제 소셜 SDK 로그인 → useSocialLogin. 지금은 임시로 홈 이동.
  const goHome = () => router.replace('/home');

  return (
    <OnboardingBackground>
      <View className="flex-1 px-5">
        <View style={{ flex: 5 }} className="items-center justify-center">
          <SyakLogo width={172} height={68} />
        </View>

        <View className="gap-3">
          <View className="gap-2">
            <SocialLoginButton
              label="Apple로 계속하기"
              backgroundColor="#000000"
              textColor="#ffffff"
              icon={appleIcon}
              onPress={goHome}
            />
            <SocialLoginButton
              label="카카오로 계속하기"
              backgroundColor="#ffee01"
              textColor="#3c1e1e"
              icon={kakaoIcon}
              onPress={goHome}
            />
            <SocialLoginButton
              label="네이버로 계속하기"
              backgroundColor="#00de5a"
              textColor="#ffffff"
              icon={naverIcon}
              onPress={goHome}
            />
          </View>
          <Pressable onPress={goHome} className="items-center justify-center p-2">
            <Text className="text-label-l font-pretendard-semibold text-gray-500">
              비회원으로 둘러보기
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 2 }} />
      </View>

      <LoginErrorToast visible={errorVisible} />
    </OnboardingBackground>
  );
}
