---
paths:
  - "app/**/*"
  - "src/**/*"
  - "app/app/**/*"
  - "app/src/**/*"
---

## 3. 폴더 구조 (페이지 기반 + shared)

```
app/                       # Expo Router 라우팅 전용 (페이지 진입점, 로직 최소화)
  _layout.tsx              # 루트 스택 레이아웃. / 진입 시 로그인 상태 보고 <Redirect>
  login.tsx                # /login            온보딩·로그인 (앱 첫 진입)
  home.tsx                 # /home             홈(지도뷰)
  notifications.tsx        # /notifications    알림
  my.tsx                   # /my               마이페이지
  shop/
    [id].tsx               # /shop/123         샵 상세

src/
  screens/                 # 페이지별 화면 구현 (그 페이지에서만 쓰는 컴포넌트·로직)
    onboarding/
    home/                  # 지도뷰
    shop-detail/
    notification/
    my/
  shared/
    ui/                    # 공통 컴포넌트 (Button, Input, Card ...)
    domain/                # 백엔드 도메인 데이터 로직 (api 요청함수 + react-query 훅 + 타입)
      auth/  shops/  reservation/  favorite/  notification/  user/
    lib/                   # fetch 래퍼, queryClient, 유틸
    api/                   # 쿠키 / 토큰 refresh 인터셉터 등 API 코어
    theme/                 # 색상·폰트·간격 토큰 (Figma 디자인값)
    types/                 # 여러 곳에서 공유하는 타입
```

### 배치 규칙
- **백엔드 도메인 데이터 로직**(API 호출 + react-query 훅 + 타입)은 페이지 수와 무관하게 **항상 `src/shared/domain/<도메인>`** 에 둔다. (샵·즐겨찾기처럼 여러 페이지가 공유하는 데이터의 중복 방지)
- **2곳 이상 페이지가 쓰는 UI 컴포넌트** → `src/shared/ui`.
- **특정 페이지에서만 쓰는 화면/부품** → `src/screens/<페이지>`.
- `app/`은 라우팅과 화면 조립만 담당한다. 비즈니스 로직·데이터 호출은 `screens`/`shared`에 둔다.

### 라우팅 규칙
- **하단 탭바 없음** → `(tabs)` 그룹을 쓰지 않는다. 모든 화면은 루트 스택 라우트이고, 화면 간 이동은 `router.push`로 한다.
- **화면 부품을 `app/` 안에 두지 않는다.** Expo Router는 `app/` 안의 모든 파일을 라우트로 취급하며, Next.js의 `_components` 같은 비공개 폴더를 지원하지 않는다. 그래서 부품은 `src/screens` / `src/shared`에 둔다.

### `index` 회피 규칙
- **라우트는 명시적 이름**(`home.tsx`, `login.tsx` 등)을 쓴다. 화면용 `index.tsx`는 만들지 않는다.
- **단, `app/index.tsx`(= `/` 진입점)는 예외로 필요하다.** 네이티브 앱은 시작 시 `/`를 여는데, 이 라우트가 없으면 매칭 실패로 스플래시에서 멈춘다(`initialRouteName`만으로는 해결 안 됨). 그래서 `app/index.tsx`는 첫 화면(splash 등)으로 보내는 얇은 `<Redirect>`만 둔다.
- `_layout.tsx`(밑줄 특수파일)는 Expo Router 필수라 **유지**한다.
- **배럴 `index.ts`(re-export 모음 파일) 금지.** import는 항상 실제 파일 경로에서 직접 한다. (예: `@/shared/ui/Button`)
