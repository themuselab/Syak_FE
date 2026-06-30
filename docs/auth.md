# 인증 (소셜 로그인 · 세션 · 로그아웃)

> 상태: **카카오 로그인 실기기(dev build) 연동·검증 완료.** 세션 확인·로그아웃·토큰 갱신 동작.
> **네이버·애플은 어댑터 stub** (카카오와 같은 패턴으로 추가 예정).
> 백엔드 계약: `../syakBE/docs/01-auth.md`, `06-user.md`, `00-overview.md`.
> dev build 셋업·재현 절차는 [dev-build.md](./dev-build.md), 라이브러리 선택은 [decisions.md](./decisions.md).

## 1. 범위
소셜 로그인(카카오·네이버·애플) + 비회원, 앱 시작 시 세션 확인, 로그아웃, 토큰 만료 처리.
소셜 토큰 획득은 provider별 **어댑터**로 격리 — 카카오는 실제 SDK 연동, 네이버·애플은 stub.

## 2. 인증 플로우
```
앱 시작 → /splash → GET /users/me (세션 확인)
        ├ 성공 → setUser → /home
        └ 실패(401) → /login
/login → 소셜 버튼
        → getSocialToken(provider)        ★ 소셜 SDK 어댑터 (카카오=실제, 네이버·애플=stub)
        → POST /auth/:provider (토큰 전달) → 쿠키 발급 + {user, isNewUser}
        → /home (신규·기존 동일, 닉네임 화면 없음)
        └ "비회원으로 둘러보기" → /home (user=null)
이후 API → 쿠키 자동 전송. AUTH_TOKEN_EXPIRED → apiFetch가 refresh 후 재시도.
        refresh 실패(AUTH_REFRESH_INVALID) → 전역 처리: setUser(null) + /login.
로그아웃 → DELETE /auth/signout → setUser(null) + /login.
```

## 3. 파일 구조 / 역할
```
app/_layout.tsx        # initializeKakaoSDK(키 있을 때, dynamic import 가드 — web/Expo Go 무시)
app.config.ts          # app.json 확장 + 카카오 plugin(조건부, nativeAppKey) + expo-build-properties(카카오 Maven repo)
eas.json               # development(devClient/internal/apk) 프로파일
metro.config.js        # @emnapi watch 제외(Windows 워처 크래시 회피)
src/shared/domain/auth/
  socialAuth.ts        # ★ 소셜 토큰 어댑터 getSocialToken(provider) — 카카오=react-native-kakao 실제, 네이버·애플=stub
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
  LoginScreen.tsx      # 소셜 버튼 → getSocialToken → useSocialLogin → /home, 로딩/에러 토스트
  SplashScreen.tsx     # getMe로 세션 확인 → /home or /login (최소 표시 1.2초)
src/screens/my/MyScreen.tsx     # 로그아웃 useSignOut 연결, 회원 시 user.nickname 표시
```

## 4. 어댑터 (소셜 토큰) — 핵심
`socialAuth.ts`의 `getSocialToken(provider)`가 provider 차이를 흡수해 **토큰 문자열 하나**만 반환한다.
- 카카오/네이버 → `accessToken`, 애플 → `identityToken` (백엔드 `access_token` 필드에 그대로 전달).
- **카카오**: `@react-native-kakao/user`의 `login()` → `accessToken` (dynamic import — web/Expo Go에선 throw → 토스트). `_layout`에서 `initializeKakaoSDK` 1회.
- **네이버·애플**: 아직 `SocialAuthNotReadyError` stub → 버튼 탭 시 "준비 중" 토스트. 추가 시 **이 파일의 해당 case만** 교체(다른 파일 무수정).

## 5. 라이브러리 / 설정 (카카오, 완료)
- `@react-native-kakao/core`·`@react-native-kakao/user`([decisions.md](./decisions.md) 선택 이유), `expo-build-properties`, `expo-dev-client`, 루트 `@expo/config-plugins`(plugin peer).
- 네이티브 앱 키는 `.env`(`EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`, git 제외) + EAS env에 주입. 앱 식별자 `com.themuselab.syak`.
- **실제 빌드/실기기 절차는 전부 [dev-build.md](./dev-build.md)에 정리.**

## 6. 남은 작업
- **네이버·애플 어댑터**: `@react-native-kakao`처럼 네이버(`@react-native-seoul/naver-login` 등)·애플(`expo-apple-authentication`) 설치 → `socialAuth.ts` 해당 case 구현. 애플 버튼은 `Platform.OS === 'ios'`에서만 노출. 카카오와 동일 패턴이라 어댑터+plugin만 추가.
- 계정 연동(`POST /auth/link/:provider`) + 마이페이지 `linkedProviders` 표시.
- 신규 가입 닉네임 입력 화면(디자인 확보 후), 회원 탈퇴(`DELETE /users/me`) 재확인 모달.
- (선택) 빌드 자동화(EAS Workflows/GitHub Actions) 또는 JS 변경용 EAS Update(OTA).

## 7. 검증
- `npm run typecheck`, `npm run lint`.
- web/Expo Go: 스플래시→세션없음→`/login`, 비회원→`/home`, 로그아웃→`/login` (카카오 버튼은 네이티브라 web에선 "준비 중" 토스트).
- **카카오 실기기(dev build)**: 로그인 → `POST /auth/kakao` 200/201 → `/home` → 마이페이지에 카카오 닉네임 표시(검증 완료). 절차 [dev-build.md](./dev-build.md).
