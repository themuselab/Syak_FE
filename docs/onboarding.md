# 온보딩 (스플래시 · 로그인 · 로그인 실패)

> 상태: **UI/UX 구현 완료**, 소셜 로그인 백엔드 연동 대기.
> 디자인 원본: `designs/온보딩/` (`온보딩.png`·`온보딩-1.png`·`로그인 실패시.png`), `designs/design.pen` 프레임 `cJc0N`(스플래시)·`Z4fqD`(로그인)·`j3fVWH`(실패).

## 1. 범위
첫 진입 로딩(스플래시) → 로그인 화면 → (실패 시) 토스트. 소비자 앱 진입점.

## 2. 화면 & 흐름
```
앱 실행
  → 네이티브 스플래시(폰트 로드까지)         [app/_layout.tsx]
  → splash 화면(브랜드 로딩, 1.5초)          [/splash]
       └ TODO(백엔드): /users/me 세션 확인 → 로그인 상태면 /home
  → login 화면                               [/login]
       ├ 소셜 버튼(Apple/카카오/네이버) → (임시)/home   [TODO: 실제 SDK 로그인]
       ├ "비회원으로 둘러보기" → /home
       └ 로그인 실패 시 하단 토스트 노출       [TODO: AUTH_SOCIAL_FAILED 연동]
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
  SplashScreen.tsx     # 로고 + 태그라인, 1.5초 후 /login
  LoginScreen.tsx      # 로고 + 소셜버튼 3 + 둘러보기 + 실패 토스트
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

## 8. 임시 동작 (UI 우선)
- 소셜 버튼·둘러보기 → 모두 `router.replace('/home')`.
- 스플래시 → 1.5초 타이머 후 `/login`.
- 실패 토스트 → `errorVisible` 상태로 제어(현재 항상 false).

## 9. 남은 작업 (백엔드 연동 단계)
- 소셜 SDK(kakao/naver/apple) 토큰 획득 → `useSocialLogin` (`src/shared/domain/auth/auth.queries.ts`) 호출, `isNewUser` 분기.
- 실패(`AUTH_SOCIAL_FAILED`) 시 `LoginErrorToast` 노출.
- 스플래시: 세션(`/users/me`) 확인 → 로그인 상태면 `/home`, 아니면 `/login`.
- 실기기 확인: SafeArea(노치), 폰트 렌더, 소셜 로그인(네이티브 전용 → dev 빌드 필요).

## 10. 검증
- `npx tsc --noEmit`
- `npx expo start --web` 후 `/login`·`/splash` 디자인 캡처와 대조 (배경/로고/버튼색/간격/폰트), 스플래시→로그인 전환, 버튼→`/home`.
