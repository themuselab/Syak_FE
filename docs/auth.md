# 인증 (소셜 로그인 · 세션 · 로그아웃)

> 상태: **인증 플로우 골격 완료** — 화면 배선·세션 확인·로그아웃·토큰 갱신 처리까지.
> **실제 소셜 SDK 연동(어댑터)·dev build는 대기**(소셜 키 발급 후).
> 백엔드 계약: `../syakBE/docs/01-auth.md`, `06-user.md`, `00-overview.md`.

## 1. 범위
소셜 로그인(카카오·네이버·애플) + 비회원, 앱 시작 시 세션 확인, 로그아웃, 토큰 만료 처리. 이번 단계는
**키·dev build에 의존하지 않는 골격**까지 — 실제 소셜 SDK 토큰 획득부만 어댑터 stub.

## 2. 인증 플로우
```
앱 시작 → /splash → GET /users/me (세션 확인)
        ├ 성공 → setUser → /home
        └ 실패(401) → /login
/login → 소셜 버튼
        → getSocialToken(provider)        ★ 소셜 SDK 어댑터 (현재 stub → "준비 중" 토스트)
        → POST /auth/:provider (토큰 전달) → 쿠키 발급 + {user, isNewUser}
        → /home (신규·기존 동일, 닉네임 화면 없음)
        └ "비회원으로 둘러보기" → /home (user=null)
이후 API → 쿠키 자동 전송. AUTH_TOKEN_EXPIRED → apiFetch가 refresh 후 재시도.
        refresh 실패(AUTH_REFRESH_INVALID) → 전역 처리: setUser(null) + /login.
로그아웃 → DELETE /auth/signout → setUser(null) + /login.
```

## 3. 파일 구조 / 역할
```
src/shared/domain/auth/
  socialAuth.ts        # ★ 소셜 토큰 어댑터 getSocialToken(provider) — provider별 SDK 자리(현재 stub)
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
src/screens/my/MyScreen.tsx     # 로그아웃 useSignOut 연결
```

## 4. 어댑터 (소셜 토큰 stub) — 핵심
`socialAuth.ts`의 `getSocialToken(provider)`가 provider 차이를 흡수해 **토큰 문자열 하나**만 반환한다.
- 카카오/네이버 → `accessToken`, 애플 → `identityToken` (백엔드 `access_token` 필드에 그대로 전달).
- 현재는 `SocialAuthNotReadyError`를 던지는 **stub** → 호출부(LoginScreen)는 완성, 버튼 탭 시 "준비 중" 토스트.
- 실제 연동 시 **이 파일의 3개 case만** SDK 코드로 교체(다른 파일 무수정).

## 5. 사용자 준비 가이드 (실제 연동에 필요)
> 코드(골격)와 별개로 아래가 갖춰져야 실제 로그인이 동작한다.

1. **백엔드 `syakBE/.env` 소셜 키** — ✅ 완료(`KAKAO_REST_API_KEY`, `NAVER_CLIENT_ID/SECRET`, `APPLE_TEAM_ID/KEY_ID/PRIVATE_KEY`).
2. **`app.json` 앱 식별자**(현재 없음, 전제): `android.package`, `ios.bundleIdentifier`(예: `app.syak`).
3. **소셜 콘솔 등록 + 앱용 키**
   - 카카오: Kakao Developers 앱 → 네이티브 앱 키, Android(패키지명+키해시)·iOS(번들ID) 플랫폼 등록, 카카오 로그인 ON.
   - 네이버: Naver Developers 모바일 앱 등록 → Client ID/Secret, iOS URL Scheme·번들ID, Android 패키지명.
   - 애플: Apple Developer Program($99/년) + App ID "Sign in with Apple" + `.p8` 키. **iOS 전용**.
4. **Expo Dev Build**(네이티브 SDK는 Expo Go 불가): 안드 `npx expo prebuild`→`run:android` 또는 EAS `eas build -p android --profile development`. iOS는 Mac+Xcode. 이후 `expo start --dev-client`.
5. **실기기 접속**: `EXPO_PUBLIC_API_URL`을 PC LAN IP로(안드 에뮬 `10.0.2.2`).

## 6. 남은 작업 (키·dev build 후)
- 패키지 설치 + config plugin: `@react-native-seoul/kakao-login`(scheme `kakao{앱키}`), `@react-native-seoul/naver-login`, `expo-apple-authentication`(`ios.usesAppleSignIn`).
- `socialAuth.ts` 어댑터 3곳 실제 연동, 애플 버튼은 `Platform.OS === 'ios'`에서만 노출.
- 계정 연동(`POST /auth/link/:provider`) + 마이페이지 `linkedProviders` 표시.
- 신규 가입 닉네임 입력 화면(디자인 확보 후), 회원 탈퇴(`DELETE /users/me`) 재확인 모달.

## 7. 검증
- `npm run typecheck`, `npm run lint`.
- 백엔드 로컬 구동 후: 스플래시→세션없음→`/login`, 소셜 버튼→"준비 중" 토스트(어댑터 stub), 비회원→`/home`, 로그아웃→`/login`.
- 실제 소셜 성공 경로는 키 발급 + dev build 후 실기기 검증.
