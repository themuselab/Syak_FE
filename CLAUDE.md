# Syak 소비자 앱 — 프론트엔드 개발 규칙

이 문서는 `syakFE`(소비자 앱) 작업 시 AI와 사람이 함께 지키는 규칙이다.
규칙과 맞지 않는 상황이 생기면 임의로 어기지 말고 이 문서를 먼저 갱신한다.

---

## 1. 프로젝트 개요 & 작업 범위

- **소비자 앱** (React Native / Expo). 대상: 일반 사용자.
- 우리가 만드는 클라이언트는 **소비자 앱 하나뿐**이다. 사장님 웹·관리자 웹은 우리 범위가 아니다.
- **코드는 `syakFE`에서만 작성한다.** `syakBE`(백엔드)는 **절대 수정하지 않는다** — 로컬에서 돌려 API를 확인하는 읽기 전용 참고용이다.
- **API 명세의 단일 출처는 `../syakBE/docs/*.md`** 이다. API 동작이 불확실하면 코드를 추측하지 말고 해당 문서를 확인한다.
  - `00-overview.md` 공통 규칙 / `01-auth.md` 인증 / `02-catalog.md` 샵 / `03-reservation.md` 예약슬롯 / `04-favorite.md` 즐겨찾기 / `05-notification.md` 알림 / `06-user.md` 유저

---

## 2. 기술 스택 (확정)

| 분류 | 선택 |
|---|---|
| 언어 | TypeScript (strict) |
| 프레임워크 | Expo (React Native) |
| 라우팅 | Expo Router (파일 기반) |
| 스타일링 | NativeWind (Tailwind CSS) |
| 서버 상태 | TanStack Query (React Query) |
| HTTP | `fetch` 얇은 래퍼 — **Axios 안 씀** |
| 클라이언트 상태 | Zustand |
| 폼 | React Hook Form |
| 아이콘 | lucide-react-native / @expo/vector-icons |

> **Axios를 쓰지 않는 이유:** React Query가 서버 상태(캐싱/리페치/로딩)를 담당하고, 전송은 RN 내장 `fetch`로 충분하다. HTTP 클라이언트를 추가로 둘 이유가 없다.

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

---

## 4. API / 데이터 레이어 규칙 (백엔드 계약 기반)

- **인증은 HTTP-only 쿠키 방식**이다 (`syak_access` / `syak_refresh`). `Authorization` 헤더를 쓰지 않으며, 토큰을 JS·AsyncStorage에 저장하지 않는다. RN 네이티브 쿠키 저장소에 의존한다.
- **Base URL은 환경변수**로 둔다: `EXPO_PUBLIC_API_URL` (개발 기본값 `http://localhost:3000/api/v1`).
- **공통 에러 형식** `{ code, message, details }` 를 파싱하는 단일 에러 핸들러를 쓴다. 분기는 `message`가 아니라 `code` 기준으로 한다.
- **토큰 자동 갱신 인터셉터**: 응답이 `AUTH_TOKEN_EXPIRED`이면 `POST /auth/token/refresh`를 호출한 뒤 원래 요청을 재시도한다.
  - 동시에 여러 요청이 만료될 때 **refresh는 1회만** 실행한다(중복 방지 큐 / single-flight).
  - `AUTH_REFRESH_INVALID`를 받으면 재로그인 필요 → 로그인 화면으로 이동.
- **React Query 컨벤션**: 쿼리 키는 `[도메인, 식별자]` 배열 규칙을 쓴다. (예: `['shops', filters]`, `['shops', shopId]`) `staleTime` 등 캐시 정책은 백엔드 TTL과 무관하게 클라에서 별도로 정한다.
- **위치**: 요청 함수와 react-query 훅은 `src/shared/domain/<도메인>`에, 공통 fetch 래퍼·인터셉터·`queryClient`는 `src/shared/api`·`src/shared/lib`에 둔다.

---

## 5. 상태 관리 규칙

- **서버에서 온 데이터 = React Query** (캐싱/로딩/에러 관리).
- **순수 클라이언트 상태 = Zustand** (예: UI 토글, 온보딩 단계, 지도 카메라 상태 등).
- 이 둘을 섞지 않는다. 서버 데이터를 Zustand에 복사해 들고 있지 않는다.

---

## 6. 스타일링 규칙 (NativeWind)

- 인라인 `style={{}}` 대신 `className`을 우선 사용한다. 반복되는 스타일은 컴포넌트로 추출한다.
- 색상·폰트·간격을 하드코딩하지 않는다 → `tailwind.config.js`의 디자인 토큰(= 디자인 값)을 참조한다.
- **디자인 위치 / 전달 방법**: 디자이너가 만든 디자인을 사람이 옮겨 `syakFE/designs/`에 둔다. 두 가지를 함께 활용한다.
  ```
  syakFE/designs/
    design.pen           # Pencil 디자인 파일 (페이지별로 구성)
    온보딩/               # 페이지별 Figma 캡처(png) 폴더
    홈지도뷰/
    상세페이지/
    알림/
    마이페이지/
    비회원로그인 알림/
  ```
  - **Figma 캡처(png)** — `designs/<페이지>/*.png`. 화면 레이아웃·상태별 화면(필터, 빈 상태, 실패 등) 파악용. 정확한 색상 HEX·폰트·간격(px)이 더 필요하면 Figma Dev Mode 수치를 함께 전달한다.
  - **Pencil — `designs/design.pen`** — 모든 디자인이 페이지별로 들어 있는 `.pen` 파일. 정확한 구조·수치는 여기서 확인한다. **반드시 `pencil` MCP 도구로만 읽는다** (`.pen`은 암호화돼 있어 Read/Grep 금지). 작업 시작 시 `get_editor_state(include_schema: true)`로 스키마부터 확인한다.
- 어떤 페이지를 구현할 때는 `designs/<페이지>/`의 캡처와 `design.pen`의 해당 페이지를 함께 본다.
- 아이콘·이미지는 SVG/PNG로 export해 프로젝트에 추가한다.

### 디자인 정확도 규칙 (중요)
- **디자인과 100% 일치하게 구현한다.** 색상·간격·폰트·크기·정렬·상태별 화면을 임의로 바꾸거나 "대충 비슷하게" 처리하지 않는다.
- **디자인이 틀렸거나, 부족하거나, 애매하거나, 빠진 부분이 있으면 임의로 추측해서 채우지 말고 무조건 사람에게 먼저 물어본다.** (예: 특정 상태의 디자인이 없음, 캡처와 `.pen` 값이 다름, 인터랙션·동작이 명시 안 됨, 수치가 불명확함 등)
- 디자인에 없는 화면/상태를 임의로 만들지 않는다. 필요하면 질문한다.

---

## 7. 코드 컨벤션

- 컴포넌트는 PascalCase, 훅은 `useXxx`, 그 외 폴더는 kebab-case로 일관되게 쓴다.
- import alias `@/`(= `src/`)를 쓴다. 깊은 상대경로(`../../../`)를 지양한다.
- TypeScript strict. `any`를 지양한다. 타입은 도메인 내부 `types.ts` 또는 `src/shared/types`에 둔다.

---

## 8. 작업 방식 규칙 (AI 협업용)

- 큰 변경 전에는 계획을 먼저 공유한다.
- 백엔드 API 동작은 추측하지 말고 `../syakBE/docs`를 확인한다.

### Git 규칙
- **항상 `main`을 기점으로 새 브랜치를 만들어 작업한다.** `main`에 직접 커밋하지 않는다.
  - 작업 시작 시: `main` 최신화(`git checkout main && git pull`) → 새 브랜치 생성(`git checkout -b <브랜치명>`).
  - 브랜치명은 작업 단위로 짓는다 (예: `feat/home-map`, `fix/login-error`).
- 커밋 메시지는 Conventional Commits(`feat:`, `fix:`, `chore:` ...)를 따른다.
- 작업 완료 후 해당 브랜치를 push 한다. (`main`으로의 병합은 PR로 진행)

### 기술 문서(docs) 규칙
문서는 **`syakFE/docs/`** 에 평평하게 모은다(백엔드 `syakBE/docs/`와 대칭). 종류는 3가지:
- **기능 명세 `docs/<기능>.md`** — 화면/기능을 구현하거나 크게 바꾸면 함께 작성·갱신하고 `docs/README.md` 인덱스에 추가. 범위·화면 흐름·라우팅·파일 구조·컴포넌트 명세·디자인 출처(`designs/`, `design.pen`)·임시 동작·남은 작업·검증 방법을 담는다.
- **`docs/troubleshooting.md`** — 오류/문제를 해결하면 기록한다(증상→원인→해결, 관련 파일/커밋). **최신 항목을 맨 위**로 누적. 같은 증상 재발 시 여기부터 검색.
- **`docs/decisions.md`** — 주요 기술 결정은 이유와 함께 기록(맥락·결정·이유·버린 대안).
- 코드와 문서가 어긋나면 문서를 사실에 맞게 고친다. 한 파일이 너무 커지면 폴더로 분리한다.
