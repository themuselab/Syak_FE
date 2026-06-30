import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ApiError, ErrorCode } from '@/shared/api/errors';
import { useSocialLogin } from '@/shared/domain/auth/auth.queries';
import type { SocialProvider } from '@/shared/domain/auth/auth.types';
import {
  getSocialToken,
  SocialAuthCancelledError,
  SocialAuthNotReadyError,
} from '@/shared/domain/auth/socialAuth';

import { LoginErrorToast } from './components/LoginErrorToast';
import { OnboardingBackground } from './components/OnboardingBackground';
import { SocialLoginButton } from './components/SocialLoginButton';
import { SyakLogo } from './components/SyakLogo';

const appleIcon = require('../../../assets/icons/social-apple.png');
const kakaoIcon = require('../../../assets/icons/social-kakao.png');
const naverIcon = require('../../../assets/icons/social-naver.png');

// 로그인 화면. 디자인: designs/온보딩/온보딩-1.png (+ 로그인 실패시.png 토스트)
// 소셜 토큰은 getSocialToken(어댑터)로 받아 useSocialLogin으로 백엔드에 전달한다.
// 실제 소셜 SDK 연동(어댑터) 전까지는 버튼 탭 시 "준비 중" 토스트가 뜬다.
export function LoginScreen() {
  const socialLogin = useSocialLogin();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSocial = async (provider: SocialProvider) => {
    if (loadingProvider) return;
    setErrorMessage(null);
    setLoadingProvider(provider);
    try {
      const token = await getSocialToken(provider);
      await socialLogin.mutateAsync({ provider, accessToken: token });
      router.replace('/home'); // 신규·기존 모두 홈 (닉네임 화면 없음)
    } catch (e) {
      const message = resolveLoginError(e);
      if (message) setErrorMessage(message); // 취소(null)는 오류 아님 → 토스트 생략
    } finally {
      setLoadingProvider(null);
    }
  };

  const goBrowse = () => router.replace('/home'); // 비회원 둘러보기 (user=null 유지)
  const busy = loadingProvider !== null;

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
              onPress={() => handleSocial('apple')}
              disabled={busy}
            />
            <SocialLoginButton
              label="카카오로 계속하기"
              backgroundColor="#ffee01"
              textColor="#3c1e1e"
              icon={kakaoIcon}
              onPress={() => handleSocial('kakao')}
              disabled={busy}
            />
            <SocialLoginButton
              label="네이버로 계속하기"
              backgroundColor="#00de5a"
              textColor="#ffffff"
              icon={naverIcon}
              onPress={() => handleSocial('naver')}
              disabled={busy}
            />
          </View>
          <Pressable onPress={goBrowse} disabled={busy} className="items-center justify-center p-2">
            <Text className="text-label-l font-pretendard-semibold text-gray-500">
              비회원으로 둘러보기
            </Text>
          </Pressable>
        </View>

        <View style={{ flex: 2 }} />
      </View>

      <LoginErrorToast visible={errorMessage !== null} message={errorMessage ?? undefined} />
    </OnboardingBackground>
  );
}

// 에러 종류별 토스트 메시지 (분기는 code/타입 기준).
// 취소(사용자가 창을 닫음)는 null → 토스트 안 띄움. 그 외는 안내 메시지.
function resolveLoginError(e: unknown): string | null {
  if (e instanceof SocialAuthCancelledError) {
    return null;
  }
  if (e instanceof SocialAuthNotReadyError) {
    return '소셜 로그인 준비 중입니다. 잠시 후 다시 시도해 주세요.';
  }
  if (e instanceof ApiError && e.code === ErrorCode.AUTH_SOCIAL_FAILED) {
    return '소셜 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
  }
  return '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
}
