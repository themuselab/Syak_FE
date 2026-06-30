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

// 사용자가 소셜 로그인 창을 직접 닫은 경우(취소). 오류가 아니므로 상위에서 토스트를 띄우지 않는다.
// (네이버 login()은 throw 대신 failureResponse.isCancel 로 취소를 알려줘서 이 에러로 변환한다.)
export class SocialAuthCancelledError extends Error {
  provider: SocialProvider;
  constructor(provider: SocialProvider) {
    super(`소셜 로그인 취소: ${provider}`);
    this.name = 'SocialAuthCancelledError';
    this.provider = provider;
  }
}

export async function getSocialToken(provider: SocialProvider): Promise<string> {
  switch (provider) {
    case 'kakao': {
      // react-native-kakao(@react-native-kakao/user). 네이티브 모듈이라 dev build에서만 동작.
      // dynamic import로 web/Expo Go 번들에 영향 없게 한다(모듈 없으면 throw → 상위에서 토스트).
      const { login } = await import('@react-native-kakao/user');
      const token = await login();
      return token.accessToken; // 백엔드 POST /auth/kakao 의 access_token
    }
    case 'naver': {
      // @react-native-seoul/naver-login. 네이티브 모듈이라 dev build에서만 동작(카카오와 동일하게 dynamic import).
      // 카카오와 달리 login()은 throw 대신 결과 객체를 반환한다 → isSuccess로 분기.
      const NaverLogin = (await import('@react-native-seoul/naver-login')).default;
      const result = await NaverLogin.login();
      if (!result.isSuccess || !result.successResponse) {
        if (result.failureResponse?.isCancel) throw new SocialAuthCancelledError('naver');
        throw new Error(result.failureResponse?.message ?? '네이버 로그인 실패');
      }
      return result.successResponse.accessToken; // 백엔드 POST /auth/naver 의 access_token
    }
    case 'apple':
      // TODO(SDK): expo-apple-authentication (iOS 전용)
      //   const cred = await AppleAuthentication.signInAsync({ requestedScopes: [...] });
      //   return cred.identityToken; // 애플은 access_token 자리에 identityToken 전달
      throw new SocialAuthNotReadyError('apple');
  }
}
