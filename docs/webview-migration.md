# 웹뷰 전환 계획 (RN → WebView)

소비자 앱(`themuselab/Syak_FE`)의 화면을 전부 웹(`themuselab/syak`)으로 옮기고,
앱은 **네이티브 셸**(푸시·위치·소셜 로그인·웹뷰)만 남긴다.

- 결정일: 2026-10-12 / 결정: **전부 웹뷰(완전 전환)** — 홈 지도까지 웹으로.
- 목적: **유지보수**. 디자인·기능 변경이 앱 심사·EAS 빌드 없이 배포 한 번으로 끝나게 한다.

---

## 1. 왜 (현재 겪는 비용)

| 지금 | 전환 후 |
|---|---|
| UI 한 줄 바꿔도 EAS 빌드 → 심사 → 출시 | 웹 배포 한 번 |
| EAS 무료 iOS 쿼터 소진 → 맥 로컬 빌드로 우회 | 해당 없음 |
| 인증서·프로비저닝 파일 수동 관리 | 셸 빌드할 때만 (거의 안 함) |
| 웹 3,945줄 + 앱 6,402줄에 샵 목록·필터·지도 로직 **중복** | 한 벌 |

---

## 2. 현재 상태 (2026-10-12 실측)

### 앱 `Syak_FE` — 6,402줄 / 110파일 / 10 라우트
`splash · index · login · home · shop/[id] · notifications · my · account · nickname · favorites`

네이티브 의존성:
`@mj-studio/react-native-naver-map`, `@react-native-seoul/naver-login`,
`@react-native-kakao/user`, `expo-apple-authentication`,
`expo-notifications`, `expo-location`, `expo-device`

### 웹 `syak` — 3,945줄 / 52파일
- Vite SPA. **라우터 없음**(단일 `App.tsx`).
- 자체 스타일. **Toss TDS 결합은 2파일·import 1건뿐**이라 재사용에 걸림돌이 아니다
  (`src/main.tsx`, `src/shared/platform/geolocation.ts`).
- 있는 것: 지도, 목록 시트, 필터, 지역 선택, 샵 상세 시트, 리드(알림 등록)
- **없는 것: 인증 · 즐겨찾기 · 알림 목록 · 마이페이지 · 계정 · 닉네임**
- 배포 타깃 2개:
  - `npm run build` → `ait build` (**토스 앱인토스 미니앱**, `granite.config.ts`)
  - `npm run build:web` → Vercel (`themuselab.kr`)

### 백엔드 — API가 이원화돼 있다
| 소비자 | 엔드포인트 |
|---|---|
| 앱 | `GET /shops` (필터·정렬·페이지네이션·bounds) |
| 웹 | `GET /web/shops/{in-bounds,pins,by-gu,partners,search}` |

전환하면 웹이 앱 화면을 담당하므로 **`/shops` 계열로 통일**한다.

### Vercel 라우팅 (건드리면 안 되는 경로)
`vercel.json` rewrites — SEO 랜딩이 서버리스로 나간다.
```
/privacy                                  → /privacy.html
/sitemap.xml                              → /api/sitemap
/{nail|hair|waxing|eyelash|pmu|massage|skincare|tanning}[/:gu] → /api/seo
```
→ **앱 화면 경로는 `/app/*` 프리픽스**를 써서 위 슬러그와 충돌시키지 않는다.

---

## 3. 최종 구조

```
┌─ 네이티브 셸 (Expo, 거의 안 바뀜) ──────────────┐
│  WebView → https://themuselab.kr/app/          │
│  · expo-notifications  (푸시 수신·권한·토큰)     │
│  · expo-location       (위치 권한·좌표)          │
│  · 소셜 로그인 SDK     (애플·카카오·네이버 앱투앱) │
│  · 브리지 window.SyakNative                     │
│  · 오프라인/로드실패 폴백 화면                    │
└────────────────────────────────────────────────┘
                     ↕ postMessage
┌─ 웹 (themuselab.kr) ───────────────────────────┐
│  /            기존 랜딩·SEO (그대로)             │
│  /app/*       소비자 앱 화면 전부                │
└────────────────────────────────────────────────┘
                     ↕ 쿠키 (동일 사이트)
            api.themuselab.kr  (/shops 계열)
```

---

## 4. 기술 결정

### 4-1. 인증 — 쿠키가 그대로 동작한다
`themuselab.kr` ↔ `api.themuselab.kr`는 **동일 사이트(same-site)**라
지금 쓰는 HttpOnly 쿠키(`syak_access` 15분 / `syak_refresh` 30일)가 웹뷰에서
브라우저와 똑같이 동작한다. 앱에서 고생한 쿠키·리프레시 처리가 오히려 단순해진다.
(`backend/.env.example`에도 `COOKIE_SAME_SITE=lax # 크로스 도메인 WebView라면 none` 주석이 이미 있다)

**단, 소셜 로그인은 네이티브 SDK를 유지한다** — 네이버 앱투앱 로그인(이번에 개선)과
Apple 로그인은 웹뷰 안 OAuth로 내리면 UX가 후퇴하고 심사에도 불리하다.
그래서 네이티브가 받은 세션을 웹뷰 쿠키 저장소로 넘기는 **핸드오프**가 필요하다.

> 방식 A (권장): 네이티브 로그인 → `POST /auth/{provider}/login` → 서버가 **1회용 code** 발급
> → 웹뷰가 `/app/session?code=...`로 진입 → 서버가 `Set-Cookie` → code 폐기
> 방식 B: 네이티브가 `WKHTTPCookieStore`/`CookieManager`에 쿠키를 직접 주입 (플랫폼별 분기 필요)

→ 백엔드에 핸드오프 엔드포인트 추가 필요.

### 4-2. 원격 로드 + 버전 핀
셸은 **원격 URL**을 로드한다(번들 동봉 ✕). 그래야 심사 없이 업데이트된다.
- 웹이 셸의 최소 버전을 요구할 수 있게 `/app/?shell=<네이티브버전>` 로 버전을 넘긴다.
- 웹이 "셸 업데이트 필요"를 판단하면 안내 화면을 띄운다(구버전 셸 보호).

### 4-3. 브리지 `window.SyakNative`
스키마를 **한 파일**로 양쪽이 공유한다(웹: 타입, 셸: 구현).

| 방향 | 메시지 | 용도 |
|---|---|---|
| 웹→셸 | `requestLocation` | 위치 권한·좌표 |
| 웹→셸 | `socialLogin(provider)` | 애플/카카오/네이버 SDK 로그인 |
| 웹→셸 | `registerPush` / `unregisterPush` | 푸시 토큰 등록 |
| 웹→셸 | `share`, `openExternal`, `haptic` | 공유·외부 링크·햅틱 |
| 셸→웹 | `pushOpened(route)` | 푸시 탭 → 해당 화면으로 딥링크 |
| 셸→웹 | `appStateChange`, `backPressed` | 포그라운드 복귀·안드 뒤로가기 |

### 4-4. 지도
웹 네이버 지도 JS로 간다(이미 `MapViewNaver.tsx` 있음).
**네이티브 SDK에서 잡아둔 것들을 JS에서 다시 확보해야 한다**:
핀 클러스터링, 축소 시 도트 전환, bounds 계산(SW 모서리 주의), 60개 제한, 스케일바.
→ 중급 안드로이드 실기기 성능 측정을 **Phase 5 종료 조건**으로 둔다.

### 4-5. 토스 미니앱과 공존
`ait build`(미니앱)와 `build:web`(Vercel)이 같은 소스를 쓴다.
`/app/*`는 웹 타깃에서만 의미가 있으므로, 미니앱 빌드에 포함돼도 무해하도록
라우트를 **지연 로딩**하고 네이티브 브리지 호출은 전부 "없으면 웹 폴백"으로 짠다.

---

## 5. 단계

| # | 단계 | 산출물 | 비고 |
|---|---|---|---|
| 0 | **1.0.1 출시** | 맥 로컬 빌드 → 심사 통과 | 전환과 병행. 이게 막혀 있으면 아무것도 못 내보낸다 |
| 1 | 웹 라우팅 + 앱 디자인 시스템 | `/app/*` 라우터, Pretendard·브랜드 토큰, 공용 UI | SEO 슬러그와 충돌 금지 |
| 2 | API 통일 | 웹이 `/shops` 계열 사용 | `/web/shops/*`는 랜딩용으로 유지 |
| 3 | 화면 이식 | 홈·샵상세·로그인·즐겨찾기·알림·마이·계정·닉네임 | 앱 `src/screens/*` → 웹 |
| 4 | 인증 핸드오프 | 백엔드 1회용 code 엔드포인트 + 셸 로그인 브리지 | 4-1 |
| 5 | 네이티브 셸 | WebView·브리지·푸시 딥링크·폴백, RN 화면 제거 | 앱 6,402줄 → 수백 줄 |
| 6 | 지도 성능 | 클러스터링·도트·bounds 재확보 + 실기기 측정 | 4-4 |
| 7 | 심사 제출 | 4.2 방어 자료 포함 | 아래 |

---

## 6. 리스크

### 6-1. App Store Guideline 4.2 (Minimum Functionality) — 가장 큼
웹을 그대로 감싼 앱은 전형적인 리젝 사유다. 이미 **2.1(a)**, **5.1.1(ii)**로 두 번 리젝당했다.

**방어** — 아래를 네이티브로 유지하고 심사 노트에 명시한다:
- 푸시 알림 (즐겨찾기 샵 빈자리 / 내 주변 반경 알림) ← 웹이 못 하는 핵심 가치
- 위치 기반 주변 검색
- 앱투앱 소셜 로그인 (네이버·카카오)
- 오프라인 폴백

### 6-2. 지도 성능
중급 안드로이드에서 웹뷰 JS 지도는 네이티브 SDK보다 느리다. 홈이 메인 화면이라 체감이 크다.
→ Phase 6에서 실기기 측정 전까지는 "전환 완료"로 보지 않는다.

### 6-3. 쿠키
웹뷰 origin이 `themuselab.kr`이면 `SameSite=lax`로 충분하다.
다른 도메인에서 로드하게 되면 `SameSite=none; Secure`로 바꿔야 한다(운영 env 동시 수정).

### 6-4. 되돌리기
Phase 5에서 RN 화면을 **지우지 말고** 플래그로 숨긴다. 심사 리젝 시 셸만 되돌려 재제출할 수 있어야 한다.

---

## 7. 참고
- [mac-local-build.md](./mac-local-build.md) — 1.0.1 빌드·제출 절차
- [home.md](./home.md) · [shop-detail.md](./shop-detail.md) — 이식 대상 화면 명세
- [decisions.md](./decisions.md) — 기존 기술 결정
- 웹 레포 `themuselab/syak` — `ARCHITECTURE.md`, `vercel.json`, `granite.config.ts`
