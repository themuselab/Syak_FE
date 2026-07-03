# 온보딩 (스플래시 · 로그인 · 로그인 실패)

> 상태: **UI/UX + 소셜 로그인(카카오·네이버) 백엔드 연동·실기기 검증 완료.** 애플은 stub. 인증 상세는 [auth.md](./auth.md).
> 디자인 원본: `designs/온보딩/` (`온보딩.png`·`온보딩-1.png`·`로그인 실패시.png`), `designs/design.pen` 프레임 `cJc0N`(스플래시)·`Z4fqD`(로그인)·`j3fVWH`(실패).

## 1. 범위
첫 진입 로딩(스플래시) → 로그인 화면 → (실패 시) 토스트. 소비자 앱 진입점.

## 2. 화면 & 흐름
```
앱 실행
  → 네이티브 스플래시(폰트 로드까지)         [app/_layout.tsx]
  → splash 화면(GET /users/me 세션 확인, 최소 표시 1.2초)   [/splash]
       ├ 세션 있음 → /home
       └ 세션 없음(401) → /login
  → login 화면                               [/login]
       ├ 소셜 버튼(카카오·네이버=실제 SDK, 애플=stub) → getSocialToken → useSocialLogin → /home
       ├ "비회원으로 둘러보기" → /home
       └ 로그인 실패 시 하단 토스트 노출(취소는 토스트 생략), 애플은 "준비 중" 토스트
```

## 3. 라우팅
- **`/` 진입점은 `app/index.tsx`** — 네이티브는 시작 시 `/`를 열기 때문에 필수. `<Redirect href="/splash" />`만 둔다. (없으면 스플래시에서 멈춤)
- 화면 이동은 `expo-router`의 `router.replace`(뒤로가기 방지).
- 라우트 파일은 얇게 — 화면 본체는 `src/screens/onboarding/`에서 가져와 렌더.
- `app/_layout.tsx`는 마운트 시 네이티브 스플래시를 즉시 해제하고, **폰트는 백그라운드 로드**(로딩 대기로 화면을 막지 않음 — 막으면 기기에서 스플래시에 멈춤).

| 라우트 | 파일 | 화면 |
|---|---|---|
| `/` | `app/index.tsx` | → `/splash`로 redirect |
| `/splash` | `app/splash.tsx` | `SplashScreen` |
| `/login` | `app/login.tsx` | `LoginScreen` |

## 4. 파일 구조
```
app/
  _layout.tsx          # 루트 스택 + providers + 폰트(백그라운드) + 스플래시 해제
  index.tsx            # '/' 진입점 → /splash 로 redirect (네이티브 진입 필수)
  splash.tsx           # /splash 라우트
  login.tsx            # /login 라우트
src/screens/onboarding/
  SplashScreen.tsx     # 로고 + 태그라인, getMe 세션 확인 → /home or /login (최소 표시 1.2초)
  LoginScreen.tsx      # 소셜버튼 3(getSocialToken → useSocialLogin) + 둘러보기 + 실패 토스트
  components/
    OnboardingBackground.tsx  # 전체화면 배경 이미지 래퍼
    SyakLogo.tsx              # 로고 이미지 (width/height props)
    SocialLoginButton.tsx     # 소셜 버튼 (label/bg/textColor/icon/onPress)
    LoginErrorToast.tsx       # 하단 실패 토스트 (visible props)
```
> 온보딩 전용 컴포넌트라 `src/shared/ui`가 아닌 페이지 폴더에 둠. (2곳 이상 쓰이면 shared로 승급)

## 5. 컴포넌트 명세
- **OnboardingBackground** `{ children }` — `assets/images/onboarding-bg.png`를 `absoluteFill`로 깔고 children을 위에 렌더.
- **SyakLogo** `{ width, height }` — `assets/images/logo-syak.png`, `contentFit="contain"`.
- **SocialLoginButton** `{ label, backgroundColor, textColor, icon, onPress }` — 높이 48 / `rounded-sm`(8) / 아이콘24+텍스트 가운데, gap 8 / 텍스트 `text-label-l font-pretendard-semibold`.
- **LoginErrorToast** `{ visible, message? }` — 하단 중앙, `bg #f8f9fa33`, `rounded-sm`, 텍스트 15 Medium `gray-500`. 기본 메시지 "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.".

## 6. 디자인 토큰 / 정확값
- 폰트 Pretendard. 태그라인 `text-heading-xl`(20/28, -0.2) 색 `#d46b8b`. 버튼 텍스트 `text-label-l`(16/20).
- 브랜드 색(토큰 외, 로컬 상수): Apple `#000000`/흰색, 카카오 `#ffee01`/`#3c1e1e`, 네이버 `#00de5a`/흰색.

## 7. 에셋
| 파일 | 출처 |
|---|---|
| `assets/images/logo-syak.png` | 사용자 제공(`designs/온보딩/syak.png`) |
| `assets/images/onboarding-bg.png` | 사용자 제공(`designs/온보딩/온보딩2.png`) |
| `assets/icons/social-apple.png` · `social-kakao.png` · `social-naver.png` | `design.pen`에서 export |

## 8. 임시 동작 (남은 것만)
- **애플 버튼**: 어댑터 stub — 탭 시 "준비 중" 토스트 (`socialAuth.ts` apple case 구현 시 자동 해소).
- ~~소셜 버튼·둘러보기 임시 /home 이동, 스플래시 1.5초 타이머, 토스트 미연동~~ → **전부 실제 연동 완료(2026-07-03 확인)**: 카카오·네이버 SDK 로그인 + 세션 확인 + 실패 토스트 동작, 실기기 검증까지 끝남. 상세 [auth.md](./auth.md).

## 9. 남은 작업
- **애플 어댑터**: `expo-apple-authentication` 설치 + `socialAuth.ts` apple case (iOS 심사 필수) — [auth.md](./auth.md) §6과 동일 항목.
- `isNewUser` 분기(신규 가입 닉네임 화면 — 디자인 확보 후).
- iOS 실기기 확인(SafeArea·폰트·소셜 로그인) — iOS 빌드 마일스톤에서.

## 10. 검증
- `npx tsc --noEmit`
- `npx expo start --web` 후 `/login`·`/splash` 디자인 캡처와 대조 (배경/로고/버튼색/간격/폰트), 스플래시→로그인 전환, 버튼→`/home`.
