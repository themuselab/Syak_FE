import type { SocialProvider } from './auth.types';

// 소셜 SDK 토큰 어댑터.
// LoginScreen은 provider별 차이를 모른 채 이 함수로 "토큰 문자열" 하나만 받는다.
// 백엔드 POST /auth/:provider 에는 카카오/네이버 = access_token, 애플 = identityToken 을 그대로 전달한다.
//
// 카카오·네이버·애플 모두 연동됨(네이티브 모듈이라 dev build에서만 동작 — 각 case의 dynamic import 가드).
// provider별 SDK 차이는 여기서 흡수하고, LoginScreen 등 호출부는 "토큰 문자열" 하나만 받는다(어댑터로 격리).

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

// 소셜 SDK가 응답하지 않을 때의 상한. 카카오계정(웹) 로그인처럼 앱 밖으로 나갔다 돌아오는
// 경로는 콜백이 유실되면 promise가 resolve도 reject도 되지 않아 버튼이 영원히 로딩에 머문다
// (QA 3차 "무한 로딩"). 근본 원인은 app.config.ts의 plugin 옵션 누락이었지만,
// 앱 전환 중 종료 등 SDK가 응답하지 않는 경로는 남으므로 상한을 둔다.
const SOCIAL_LOGIN_TIMEOUT_MS = 60_000;

// 소셜 SDK가 제한 시간 내 응답하지 않음. (사용자 취소·검증 실패와 구분)
export class SocialAuthTimeoutError extends Error {
  provider: SocialProvider;
  constructor(provider: SocialProvider) {
    super(`소셜 로그인 응답 없음: ${provider}`);
    this.name = 'SocialAuthTimeoutError';
    this.provider = provider;
  }
}

// 소셜 로그인 결과. token은 백엔드로 보낼 토큰(카카오/네이버=access_token, 애플=identityToken).
// name은 애플 전용 — 애플은 이름을 identityToken에 넣지 않고 "최초 동의 시 fullName으로 딱 한 번"만
// 준다. 그 이름을 백엔드로 함께 보내 "이름없음" 유저를 방지한다(카카오/네이버는 프로필에 닉네임 포함).
export type SocialCredential = { token: string; name?: string };

export async function getSocialToken(provider: SocialProvider): Promise<SocialCredential> {
  return withTimeout(requestSocialToken(provider), provider);
}

function withTimeout(
  task: Promise<SocialCredential>,
  provider: SocialProvider,
): Promise<SocialCredential> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SocialAuthTimeoutError(provider)), SOCIAL_LOGIN_TIMEOUT_MS);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

// 애플 fullName(PersonNameComponents) → 표시 이름. 한국 사용자 우선(성+이름 순, 공백 없이).
// 최초 동의 때만 값이 오고, 이후 로그인엔 null → undefined 반환(백엔드가 기존 이름 유지).
function composeAppleName(fullName: {
  familyName?: string | null;
  givenName?: string | null;
} | null): string | undefined {
  if (!fullName) return undefined;
  const joined = [fullName.familyName, fullName.givenName].filter(Boolean).join('').trim();
  return joined || undefined;
}

async function requestSocialToken(provider: SocialProvider): Promise<SocialCredential> {
  switch (provider) {
    case 'kakao': {
      // react-native-kakao(@react-native-kakao/user). 네이티브 모듈이라 dev build에서만 동작.
      // dynamic import로 web/Expo Go 번들에 영향 없게 한다(모듈 없으면 throw → 상위에서 토스트).
      const { login } = await import('@react-native-kakao/user');
      const token = await login();
      return { token: token.accessToken }; // 백엔드 POST /auth/kakao 의 access_token
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
      return { token: result.successResponse.accessToken }; // 백엔드 POST /auth/naver 의 access_token
    }
    case 'apple': {
      // expo-apple-authentication (iOS 전용). 카카오/네이버와 동일한 dynamic import 가드 —
      // 안드로이드/미지원 환경에선 버튼 자체가 숨겨지고(LoginScreen), import·호출 실패는 상위 토스트.
      const AppleAuthentication = await import('expo-apple-authentication');
      try {
        const cred = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (!cred.identityToken) throw new Error('Apple identityToken 없음');
        // identityToken=access_token 자리, name=최초 동의 때만 오는 fullName(백엔드 닉네임 보완).
        return { token: cred.identityToken, name: composeAppleName(cred.fullName) };
      } catch (e) {
        // 사용자가 시트를 닫으면 ERR_REQUEST_CANCELED — 취소로 변환(오류 토스트 안 띄움).
        if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
          throw new SocialAuthCancelledError('apple');
        }
        throw e;
      }
    }
  }
}
