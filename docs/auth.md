# 인증 (소셜 로그인 · 세션 · 로그아웃)

> 상태: **카카오·네이버 로그인 실기기(dev build) 연동·검증 완료.** 세션 확인·로그아웃·토큰 갱신 동작. **애플 구현 완료(dev build·애플 개발자 설정 대기).**
> (네이버는 2026-06-30 지도 dev build에 로그인 SDK·키가 함께 포함돼 빌드됐고, 실기기 로그인 검증 완료 — 2026-07-03 확인)
> 백엔드 계약: `../syakBE/docs/01-auth.md`, `06-user.md`, `00-overview.md`.
> dev build 셋업·재현 절차는 [dev-build.md](./dev-build.md), 라이브러리 선택은 [decisions.md](./decisions.md).

## 1. 범위
소셜 로그인(카카오·네이버·애플) + 비회원, 앱 시작 시 세션 확인, 로그아웃, 토큰 만료 처리.
소셜 토큰 획득은 provider별 **어댑터**로 격리 — 카카오·네이버·애플 모두 실제 SDK 연동(네이티브 — dev build 전용).

## 2. 인증 플로우
```
앱 시작 → /splash → GET /users/me (세션 확인)
        ├ 성공 → setUser → /home
        └ 실패(401) → /login
/login → 소셜 버튼
        → getSocialToken(provider)        ★ 소셜 SDK 어댑터 (카카오·네이버=실제, 애플=실제)
        → POST /auth/:provider (토큰 전달) → 쿠키 발급 + {user, isNewUser}
        → /home (신규·기존 동일, 닉네임 화면 없음)
        └ "비회원으로 둘러보기" → /home (user=null)
이후 API → 쿠키 자동 전송. AUTH_TOKEN_EXPIRED → apiFetch가 refresh 후 재시도.
        refresh 실패(AUTH_REFRESH_INVALID) → 전역 처리: setUser(null) + /login.
로그아웃 → DELETE /auth/signout → setUser(null) + /login.
```

## 3. 파일 구조 / 역할
```
app/_layout.tsx        # initializeKakaoSDK + NaverLogin.initialize (각 키 있을 때, dynamic import 가드 — web/Expo Go 무시)
app.config.ts          # app.json 확장 + 카카오·네이버 plugin(각 조건부) + expo-build-properties(카카오 Maven repo)
                       # ★ 카카오 plugin은 nativeAppKey만이 아니라 android/ios 옵션까지 넘겨야 한다(아래 §카카오 plugin 옵션)
eas.json               # development(devClient/internal/apk) 프로파일
metro.config.js        # @emnapi watch 제외(Windows 워처 크래시 회피)
src/shared/domain/auth/
  socialAuth.ts        # ★ 소셜 토큰 어댑터 getSocialToken(provider) — 카카오·네이버=실제 SDK, 애플=실제. 취소(SocialAuthCancelledError) 구분
  auth.api.ts          # socialLogin(POST /auth/:provider), signOut(DELETE /auth/signout)
  auth.queries.ts      # useSocialLogin, useSignOut(onSettled로 세션 비움)
  auth.store.ts        # useAuthStore (user만, 토큰 X)
  auth.types.ts        # SocialProvider, AuthUser(nickname/profileImage nullable), SocialLoginResponse
src/shared/domain/user/
  user.api.ts          # getMe(GET /users/me)
  user.queries.ts      # useMe(enabled 제어)
  user.types.ts        # UserProfile(linkedProviders/createdAt 포함)
src/shared/api/        # client(쿠키 credentials:'include' + refresh 재시도), errors, refresh(single-flight)
src/shared/lib/queryClient.ts  # AUTH_REFRESH_INVALID 전역 처리 + 인증에러 no-retry
src/screens/onboarding/
  LoginScreen.tsx      # 소셜 버튼 → getSocialToken → useSocialLogin → /home, 로딩/에러 토스트(취소는 토스트 생략)
  SplashScreen.tsx     # getMe로 세션 확인 → /home or /login (최소 표시 1.2초)
src/screens/my/MyScreen.tsx     # 로그아웃 useSignOut 연결, 회원 시 user.nickname 표시
```

## 4. 어댑터 (소셜 토큰) — 핵심
`socialAuth.ts`의 `getSocialToken(provider)`가 provider 차이를 흡수해 **토큰 문자열 하나**만 반환한다.
- 카카오/네이버 → `accessToken`, 애플 → `identityToken` (백엔드 `access_token` 필드에 그대로 전달).
- **카카오**: `@react-native-kakao/user`의 `login()` → `accessToken` (dynamic import — web/Expo Go에선 throw → 토스트). `_layout`에서 `initializeKakaoSDK` 1회.
  - `login()`은 네이티브에서 **카카오톡 설치 여부로 분기**한다 — 설치 시 `loginWithKakaoTalk`(앱 간), 미설치 시 `loginWithKakaoAccount`(Custom Tabs 웹). **웹 경로는 `AuthCodeHandlerActivity`가 있어야 콜백이 돌아온다** → 아래 plugin 옵션 필수.

### 카카오 plugin 옵션 (2026-07-28 QA 3차 — 필수)
`app.config.ts`에서 `@react-native-kakao/core` plugin에 **`android`/`ios` 옵션을 반드시 넘긴다.** plugin 본체가 `if (android)` / `if (ios)`로 가드하고 기본값이 없어, 안 넘기면 네이티브 주입이 통째로 스킵된다(빌드는 성공 — 로그인만 죽음).
```ts
['@react-native-kakao/core', {
  nativeAppKey,
  android: { authCodeHandlerActivity: true },   // kakao{키}://oauth 콜백 수신
  ios: { handleKakaoOpenUrl: true },            // CFBundleURLTypes·LSApplicationQueriesSchemes·AppDelegate
}]
```
채널(`followChannelHandlerActivity`)·카카오링크(`forwardKakaoLinkIntentFilterToMainActivity`)·내비(`naviApplicationQuerySchemes`)는 미사용이라 켜지 않는다.
**변경 시 EAS 재빌드 필수.** 반영 확인은 `npx expo prebuild --platform android --no-install` 후 `AndroidManifest.xml`에서 `AuthCodeHandlerActivity` 검색(확인 후 `android/` 삭제, prebuild가 바꾼 `package.json` scripts 되돌리기).
> 네이버는 Android에 키해시·manifest가 불필요하고 plugin이 iOS만 건드린다 — "네이버는 되는데 카카오만 안 됨" 패턴의 이유.

### 로그인 실패 진단 (2026-07-28)
실패 원인이 전부 같은 토스트로 보여 제보만으로 좁힐 수 없던 문제를 해소했다.
- `apiFetch` 15초 타임아웃 + 네트워크 실패를 `NETWORK_ERROR`/`TIMEOUT` `ApiError`로 정규화(`client.ts`·`errors.ts`)
- 소셜 SDK 60초 상한 `SocialAuthTimeoutError`(`socialAuth.ts`) — 콜백 유실 시 무한 로딩 방지
- `resolveLoginError`가 네트워크/타임아웃/소셜검증실패/그 외를 구분하고, 미분류는 문구 끝에 식별자를 붙인다(예: `(SHOP_NOT_FOUND)`, `(TypeError)`) → **QA 스크린샷만으로 분기 가능**
- `_layout.tsx`의 SDK init 실패는 `console.warn('[auth] ... init failed')`로 남긴다(이전엔 빈 `.catch(() => {})`로 삼킴)
- **네이버**: `@react-native-seoul/naver-login`의 `login()` → `successResponse.accessToken`. 카카오와 달리 **throw가 아니라 결과 객체**(`{ isSuccess, successResponse, failureResponse }`)를 반환하므로 `isSuccess`로 분기. 사용자가 창을 닫으면(`failureResponse.isCancel`) `SocialAuthCancelledError`로 변환 → LoginScreen이 **토스트를 생략**(취소는 오류 아님). `_layout`에서 `NaverLogin.initialize`(consumerKey·consumerSecret·appName) 1회.
- **애플**: `expo-apple-authentication` 연동(`identityToken` 반환, 취소=`ERR_REQUEST_CANCELED`→`SocialAuthCancelledError`). 버튼은 iOS 전용(안드 숨김). 백엔드 `POST /auth/apple`(AppleAuthProvider) 지원됨.

## 5. 라이브러리 / 설정
- **카카오(완료)**: `@react-native-kakao/core`·`@react-native-kakao/user`, `expo-build-properties`, `expo-dev-client`, 루트 `@expo/config-plugins`(plugin peer). 네이티브 앱 키 `.env`(`EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`) + EAS env.
- **네이버(완료)**: `@react-native-seoul/naver-login`([decisions.md](./decisions.md) 선택 이유·secret 노출 트레이드오프). `.env` 키 4종 — `EXPO_PUBLIC_NAVER_CONSUMER_KEY`/`_CONSUMER_SECRET`/`_APP_NAME`/`_URL_SCHEME`(전부 git 제외, `.env.example`에 양식). 키가 없으면 plugin·init이 조건부로 빠져 안전.
- 앱 식별자 `com.themuselab.syak`(카카오·네이버 공통). **실제 빌드/콘솔/실기기 절차는 전부 [dev-build.md](./dev-build.md)에 정리.**

## 6. 남은 작업
- **네이버 마무리**: 키 발급(네이버 개발자센터) → `.env`·EAS env 주입 → EAS 재빌드 → 콘솔 등록 → 실기기 검증. 코드는 완료. 절차 [dev-build.md](./dev-build.md) 네이버 섹션.
  - ✅ **전부 완료(2026-07-03 확인)** — 키 발급·`.env`·EAS env 등록 완료, 로그인 SDK는 6/30 지도 dev build에 함께 포함, 실기기 네이버 로그인 검증까지 끝남. 더 이상 남은 작업 아님.
- ~~애플 어댑터~~ **완료**(expo-apple-authentication). 남은 것: iOS dev/EAS 빌드 + 애플 개발자 App ID "Sign in with Apple" 활성화. ⚠️ 백엔드 AppleAuthProvider의 `audience`가 APPLE_TEAM_ID인데 애플 aud는 앱 번들ID여야 함 — 검증 확인 필요.
- 계정 연동(`POST /auth/link/:provider`) + 마이페이지 `linkedProviders` 표시.
- 신규 가입 닉네임 입력 화면(디자인 확보 후), 회원 탈퇴(`DELETE /users/me`) 재확인 모달.
- (선택) 빌드 자동화(EAS Workflows/GitHub Actions) 또는 JS 변경용 EAS Update(OTA).

## 7. 검증
- `npm run typecheck`, `npm run lint`.
- web/Expo Go: 스플래시→세션없음→`/login`, 비회원→`/home`, 로그아웃→`/login` (카카오·네이버 버튼은 네이티브라 web/키 없는 환경에선 실패 토스트).
- **카카오 실기기(dev build)**: 로그인 → `POST /auth/kakao` 200/201 → `/home` → 마이페이지에 카카오 닉네임 표시(검증 완료). 절차 [dev-build.md](./dev-build.md).
- **네이버 실기기(dev build)**: 로그인 → `POST /auth/naver` 200/201 → `/home` → 마이페이지 닉네임 표시(검증 완료, 2026-07-03).
