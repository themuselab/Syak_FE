import type { SocialProvider } from './auth.types';

// 소셜 SDK 토큰 어댑터.
// LoginScreen은 provider별 차이를 모른 채 이 함수로 "토큰 문자열" 하나만 받는다.
// 백엔드 POST /auth/:provider 에는 카카오/네이버 = access_token, 애플 = identityToken 을 그대로 전달한다.
//
// ★ 실제 SDK 연동은 dev build + 소셜 키 발급 후 (아래 각 case의 TODO 자리만 채우면 됨).
//   현재는 미연동 stub — 호출 시 SocialAuthNotReadyError 를 던진다.
//   교체해도 LoginScreen 등 호출부는 바뀌지 않는다(어댑터로 격리).

// 소셜 SDK가 아직 연동되지 않았음을 알리는 에러. (실제 소셜 검증 실패 AUTH_SOCIAL_FAILED 와 구분)
export class SocialAuthNotReadyError extends Error {
  provider: SocialProvider;
  constructor(provider: SocialProvider) {
    super(`소셜 SDK 미연동: ${provider} (dev build + 키 발급 후 구현)`);
    this.name = 'SocialAuthNotReadyError';
    this.provider = provider;
  }
}

export async function getSocialToken(provider: SocialProvider): Promise<string> {
  switch (provider) {
    case 'kakao':
      // TODO(SDK): @react-native-seoul/kakao-login
      //   import { login } from '@react-native-seoul/kakao-login';
      //   const token = await login();
      //   return token.accessToken;
      throw new SocialAuthNotReadyError('kakao');
    case 'naver':
      // TODO(SDK): @react-native-seoul/naver-login
      //   const { successResponse } = await NaverLogin.login();
      //   return successResponse.accessToken;
      throw new SocialAuthNotReadyError('naver');
    case 'apple':
      // TODO(SDK): expo-apple-authentication (iOS 전용)
      //   const cred = await AppleAuthentication.signInAsync({ requestedScopes: [...] });
      //   return cred.identityToken; // 애플은 access_token 자리에 identityToken 전달
      throw new SocialAuthNotReadyError('apple');
  }
}
