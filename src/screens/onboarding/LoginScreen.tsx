import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';

import { ApiError, ErrorCode } from '@/shared/api/errors';
import { useSocialLogin } from '@/shared/domain/auth/auth.queries';
import type { SocialProvider } from '@/shared/domain/auth/auth.types';
import {
  getSocialToken,
  SocialAuthCancelledError,
  SocialAuthNotReadyError,
  SocialAuthTimeoutError,
} from '@/shared/domain/auth/socialAuth';

import { useShellInfo } from '@/shell/bridgeClient';

import { LoginErrorToast } from './components/LoginErrorToast';
import { LoginPanel } from './components/LoginPanel';
import { OnboardingBackground } from './components/OnboardingBackground';
import { SocialLoginButton } from './components/SocialLoginButton';
import { SyakLogo } from './components/SyakLogo';
import { colors } from '@/shared/theme/colors';

const appleIcon = require('../../../assets/icons/social-apple.png');
const kakaoIcon = require('../../../assets/icons/social-kakao.png');
const naverIcon = require('../../../assets/icons/social-naver.png');

// 로그인 화면. 디자인: 디자이너 시안 2026-10-15 (핑크 그라데이션 + 흰 로고 + 반투명 버튼 패널).
// 소셜 토큰은 getSocialToken(어댑터)로 받아 useSocialLogin으로 백엔드에 전달한다.
// 실제 소셜 SDK 연동(어댑터) 전까지는 버튼 탭 시 "준비 중" 토스트가 뜬다.
type Props = {
  /**
   * 스플래시에서 이어지는 모드. 처음엔 로고·태그라인이 화면 정중앙(스플래시 모양)에 있다가
   * revealed가 true가 되면 로고·문구가 위로 올라가고 버튼 패널이 아래에서 올라온다 — 한 화면 안의
   * 연속 애니메이션이라 "화면이 바뀌는" 끊김이 없다(디자이너 요청).
   * /login 라우트로 직접 들어오면(로그인 유도 팝업 등) 로고는 제자리, 패널만 올라온다.
   */
  intro?: boolean;
  revealed?: boolean;
};

export function LoginScreen({ intro = false, revealed = true }: Props) {
  const shell = useShellInfo();
  const socialLogin = useSocialLogin();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSocial = async (provider: SocialProvider) => {
    if (loadingProvider) return;
    setErrorMessage(null);
    setLoadingProvider(provider);
    try {
      const { token, name } = await getSocialToken(provider);
      await socialLogin.mutateAsync({ provider, accessToken: token, name });
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

  // ── 스플래시 → 로그인 전환 ──
  // 레이아웃은 처음부터 "로그인 모양"이다. 스플래시 단계에선 로고 묶음을 화면 정중앙까지 내려
  // 보여주고(translateY = shift), 전환 때 0으로 올린다. shift는 실측해서 기기 높이와 무관하다.
  const progress = useRef(new Animated.Value(0)).current;
  const [screenH, setScreenH] = useState(0);
  const [group, setGroup] = useState<{ y: number; h: number } | null>(null);
  const shift = intro && group && screenH ? screenH / 2 - (group.y + group.h / 2) : 0;
  // 실측 전 한 프레임은 숨긴다 — 안 그러면 로고가 위에 떴다가 가운데로 툭 떨어진다.
  const measured = !intro || (group !== null && screenH > 0);

  useEffect(() => {
    if (!revealed || !measured) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: intro ? 760 : 520,
      delay: intro ? 0 : 120,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // 빠르게 출발해 부드럽게 멈춤
      // react-native-web엔 네이티브 드라이버가 없다 — true면 웹에서 애니메이션이 시작되지 않는다.
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [revealed, measured, intro, progress]);

  const groupStyle = intro
    ? { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [shift, 0] }) }] }
    : undefined;

  return (
    <OnboardingBackground>
      <View
        className="flex-1 px-5 pb-8"
        style={{ opacity: measured ? 1 : 0 }}
        onLayout={(e) => setScreenH(e.nativeEvent.layout.height)}
      >
        {/* 로고 + 문구. 스플래시 단계엔 화면 가운데(태그라인), 전환되면 위로 올라가며 로그인 문구로 바뀐다. */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={[{ alignItems: 'center' }, groupStyle]}
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              if (!group) setGroup({ y, h: height });
            }}
          >
            <SyakLogo size={112} />
            <View className="mt-6 items-center justify-start" style={{ minHeight: 48 }}>
              {/* 로그인 문구 — 전환 후반에 나타난다 */}
              <Animated.Text
                className="text-center text-body-l font-pretendard-medium"
                style={{
                  color: colors.white,
                  lineHeight: 24,
                  opacity: intro
                    ? progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 0.9] })
                    : 0.9,
                }}
              >
                {'빈자리·예약·할인 정보\n샥에서 한 번에 모아보기'}
              </Animated.Text>
              {/* 스플래시 태그라인 — 같은 자리에서 전환 초반에 사라진다 */}
              {intro && (
                <Animated.Text
                  className="absolute text-center text-body-l font-pretendard-medium"
                  style={{
                    top: 0,
                    color: colors.white,
                    opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.9, 0, 0] }),
                  }}
                >
                  빈자리, 샥 찾자
                </Animated.Text>
              )}
            </View>
          </Animated.View>
        </View>

        <LoginPanel progress={progress} interactive={revealed}>
          <View className="gap-2">
            {/* Apple 로그인은 iOS 전용(앱스토어 심사 필수) — 안드로이드에선 숨김 (QA #0).
                웹뷰 셸 안에선 Platform.OS가 'web'이라 셸이 알려준 실제 OS로 판단한다 —
                안 그러면 iOS 앱에서 Apple 로그인이 사라져 심사에 걸린다. */}
            {(Platform.OS === 'ios' || shell?.platform === 'ios') && (
              <SocialLoginButton
                label="Apple 로그인"
                backgroundColor={colors.overlay.shadow}
                textColor={colors.white}
                icon={appleIcon}
                onPress={() => handleSocial('apple')}
                disabled={busy}
              />
            )}
            <SocialLoginButton
              label="카카오 로그인"
              backgroundColor={colors.social.kakao}
              textColor={colors.social.kakaoText}
              icon={kakaoIcon}
              onPress={() => handleSocial('kakao')}
              disabled={busy}
            />
            <SocialLoginButton
              label="네이버 로그인"
              backgroundColor={colors.social.naver}
              textColor={colors.white}
              icon={naverIcon}
              onPress={() => handleSocial('naver')}
              disabled={busy}
            />
          </View>

          {/* 실패 시에는 "비회원으로 둘러보기" 자리에 토스트가 들어간다(시안). 둘이 겹치지 않는다. */}
          {errorMessage !== null ? (
            <LoginErrorToast message={errorMessage} />
          ) : (
            <Pressable onPress={goBrowse} disabled={busy} className="items-center justify-center py-1">
              <Text className="text-label-l font-pretendard-semibold" style={{ color: colors.white }}>
                비회원으로 둘러보기
              </Text>
            </Pressable>
          )}
        </LoginPanel>
      </View>
    </OnboardingBackground>
  );
}

// 에러 종류별 토스트 메시지 (분기는 code/타입 기준).
// 취소(사용자가 창을 닫음)는 null → 토스트 안 띄움. 그 외는 안내 메시지.
//
// QA 3차: 이전에는 SDK 미초기화·키해시·네트워크·HTTP 4xx/5xx·JSON 파싱 실패가 전부
// "로그인에 실패했어요" 한 줄로 보여 제보만으로는 원인을 좁힐 수 없었다. 원인별로 문구를 나누고,
// 분류되지 않은 경우엔 식별자를 덧붙여 스크린샷만으로 분기가 되게 한다.
function resolveLoginError(e: unknown): string | null {
  if (e instanceof SocialAuthCancelledError) {
    return null;
  }
  if (e instanceof SocialAuthTimeoutError) {
    return '로그인 창에서 응답이 없어요. 다시 시도해 주세요.';
  }
  if (e instanceof SocialAuthNotReadyError) {
    return '소셜 로그인 준비 중입니다. 잠시 후 다시 시도해 주세요.';
  }
  if (e instanceof ApiError) {
    switch (e.code) {
      case ErrorCode.NETWORK_ERROR:
        return '네트워크에 연결할 수 없어요. 연결 상태를 확인해 주세요.';
      case ErrorCode.TIMEOUT:
        return '서버 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.';
      case ErrorCode.AUTH_SOCIAL_FAILED:
        return '소셜 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
      default:
        return `로그인에 실패했어요. (${e.code})`;
    }
  }
  // 소셜 SDK 자체 실패(초기화 누락·키해시 미등록 등)가 주로 여기로 온다.
  const detail = e instanceof Error ? e.name : 'Unknown';
  return `로그인에 실패했어요. 잠시 후 다시 시도해 주세요. (${detail})`;
}
