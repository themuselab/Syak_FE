# 기술 결정 기록 (ADR-lite)

주요 기술 결정과 이유를 누적한다. **최신 항목을 맨 위(역순)**. "왜 이렇게 했지?"를 나중에 빠르게 확인하기 위함.

> 항목 양식
> ```
> ## YYYY-MM-DD · 결정: <무엇>
> - 맥락/문제:
> - 결정:
> - 이유:
> - 대안(버린 것):
> ```

---

## 2026-07-03 · 결정: 예약시간 필터 = `/slots/search` 결과와 목록 클라 교집합
- 맥락/문제: 홈 예약시간 필터는 시간 다중 선택 UI인데, `GET /shops`의 `slot_time`은 **단일 값**만 받는다.
- 결정: 시간 선택 시 `GET /slots/search`(dates·times 다중 지원)로 가능한 샵 ID를 받아 **목록과 클라 교집합**. 날짜만 선택 시엔 `slot_date` 서버 파라미터로 충분(교집합 호출 안 함). 시간만 선택하면 날짜는 '오늘'로 간주(slots/search는 dates 필수).
- 이유: UI(다중 시간)를 그대로 살리면서 백엔드 무수정. 요청 1개 추가 비용만.
- 대안(버림): slot_time 단일 제한(다중 선택 시 무시 — UX 훼손), 백엔드에 다중 slot_time 요청(수정 대기 발생).
- 관련: `src/screens/home/filtersToParams.ts`(toSlotSearchParams), `HomeScreen.tsx`, [home.md](./home.md) §3

## 2026-07-03 · 결정: 데이터 소스 = 로컬 도커 + Supabase REST env 주입 (실시간 4만 매장)
- 맥락/문제: 백엔드가 supabase-js(REST) 전환·배포됐지만 로컬 도커는 구이미지(시드 30개)였고, 새 코드는 `SUPABASE_URL`/`SUPABASE_SECRET_KEY` env를 요구하는데 로컬 어디에도 없었다.
- 결정: `syakBE/docker-compose.override.yml`(로컬 전용, 커밋 금지)에 두 env를 주입하고 `docker compose up -d --build app`으로 재빌드 → 로컬 백엔드가 실서비스 Supabase를 실시간 조회(40,839 매장). `SUPABASE_DATABASE_URL`(SlotListener)·`DATABASE_URL`(users 등)은 로컬 db 유지(Supabase 직결은 IPv6 전용이라 불가).
- 이유: 개발 중 백엔드 로그를 직접 볼 수 있고(디버깅), 시드/스냅샷 관리가 사라진다. 운영 URL(`http://54.116.107.78/api/v1`)은 교차 검증용.
- 대안(버림): 운영 URL 직접 사용(로그 접근 불가·운영 상태 의존), 시드 유지(새 필드 없음·정합성 관리 부담).
- 관련: [dev-build.md](./dev-build.md) D절, [home.md](./home.md) §4

## 2026-07-02 · 결정: 상세 빈자리 = slots API 3일치를 클라에서 구간 그룹핑
- 맥락/문제: 디자인의 빈자리는 "앞으로 3일간" × 오전/오후/저녁 구간 구조인데, 백엔드 `GET /slots/shop/:id`는 flat `{date, startTime}` 배열(기본 3일치)만 준다. 상세 응답의 `slotSummary`(디자이너별 오늘 시각)와는 다른 소스.
- 결정: 빈자리 섹션은 **slots API**를 쓰고, 클라 어댑터(`shopDetailToView.buildAvailability`)에서 오늘 기준 3일 고정 생성 → date별 그룹 → 오전(<12:00)/오후(12:00~18:00)/저녁(≥18:00) 분배, 빈 구간은 '마감되었습니다'.
- 이유: API 기본값(3일치)이 디자인과 정확히 일치, 'HH:MM' 문자열 비교로 구간 분배가 단순·안정. slotSummary는 오늘·디자이너별이라 디자인 구조와 안 맞음.
- 대안(버림): slotSummary 사용(3일 불가), 백엔드에 그룹핑 요청(표현 로직은 클라 소관).
- 관련: `src/screens/shop-detail/shopDetailToView.ts`, `src/shared/domain/reservation/`, [shop-detail.md](./shop-detail.md)

## 2026-06-30 · 결정: 지도 라이브러리 = `@mj-studio/react-native-naver-map`
- 맥락/문제: 홈 지도(한국 매장 앱). 후보 = 네이버지도 / 카카오맵(`@react-native-kakao/map`, 이미 카카오 SDK 사용 중) / 구글(`react-native-maps`).
- 결정: **`@mj-studio/react-native-naver-map` v2.9.0** 채택.
- 이유: New Architecture·Expo config plugin·dev build 지원. **Mobile Dynamic Map 월 1억 호출 무료**(우리 규모 사실상 무비용, 카드 등록만 필요). 한국 POI·디자인(소비자 메인)과 일치. `design.pen` 핀 PNG가 이미 3종(`pin-partner/discount/reservable.png`)이라 마커 매핑이 직결. home.md 원래 계획과 일치.
- 대안(버림): 카카오맵(무료·SDK 일관성은 있으나 비용 해소로 우위 사라짐), 구글(`react-native-maps` — 한국 지도 데이터·POI 약함, 디자인 톤 다름), NCP Web Dynamic Map(웹 전용·유료).
- 비용 메모: Mobile 월 1억 무료(현행 유지) / Web은 월 1천만 무료·초과 0.1원/건. NCP 콘솔에서 사용 한도 제한 가능.
- 관련: `src/screens/home/components/HomeMap.tsx`, `app.config.ts`, [home.md](./home.md), [dev-build.md](./dev-build.md)

## 2026-06-30 · 결정: 홈 샵 목록 = 필터된 전체를 받아 클라에서 핀 (지도 bounds 미지원)
- 맥락/문제: 백엔드 `GET /shops`는 좌표(`lat`/`lng`)를 주지만 **지도영역(bounds)·중심+반경 조회가 없다**. 지도에 핀을 찍으려면 화면 후보 전체가 필요.
- 결정: 필터 파라미터로 **`limit:100` 단일 조회** → 클라에서 목록 + 지도 핀. 무한스크롤·뷰포트 재조회는 추후.
- 이유: 현재 지역이 서울 단일이고 필터 적용 후 결과가 100건을 넘기 어렵다. bounds 없이도 핀 표시가 된다.
- 대안(버림): 무한스크롤(지도 핀엔 전체가 필요해 부적합), 뷰포트 기반 재조회(백엔드 미지원).
- 관련: `src/shared/domain/shops/`, [home.md](./home.md)

## 2026-06-30 · 결정: 홈 즐겨찾기 1차 로컬 토글 (API는 로그인 후)
- 맥락/문제: 홈은 **비회원 접근**(`GET /shops` 무인증)인데 `/favorites`는 **인증 필요**. 비회원이 별을 누르면 401.
- 결정: 1차는 `favoriteIds`(로컬 Set) 토글만. `/favorites` 실연동은 소셜 로그인 dev build 이후, 비회원은 그때 `비회원로그인 알림` 모달로 유도.
- 이유: 비회원 흐름을 깨지 않고 화면을 완성. 로그인 플로우가 갖춰진 뒤 연동이 자연스럽다.
- 대안(버림): 지금 `/favorites` 연동(비회원 401 처리·로그인 가드 부담이 먼저), 즐겨찾기 버튼 비활성(디자인 변경).
- 관련: `src/screens/home/HomeScreen.tsx`, [home.md](./home.md) §3

## 2026-06-30 · 결정: 네이버 로그인 라이브러리 = `@react-native-seoul/naver-login`
- 맥락/문제: 카카오 다음으로 네이버 로그인 추가. 백엔드 `POST /auth/naver`는 클라가 받은 네이버 `access_token`을 그대로 받아 `openapi.naver.com/v1/nid/me`로 검증한다(카카오와 동일 계약). 프론트는 네이버 SDK로 access_token만 얻으면 됨.
- 결정: **`@react-native-seoul/naver-login`(v4.2.4, 2026-01)** 채택.
- 이유: 네이버는 카카오와 달리 **사실상 대체재가 없다** — 이 라이브러리(crossplatformkorea 관리)가 유일한 유지보수 표준이고 Expo config plugin·dev build를 지원한다. New Architecture 명시는 없으나 최신 릴리스(RN 0.81 시기)라 채택해 진행하고, 빌드/런타임 문제 시 그때 대응한다. (카카오에서 `@react-native-seoul/kakao-login`을 new arch 미보장으로 기각했지만, 네이버는 이 라이브러리 외 선택지 자체가 없음.)
- **트레이드오프(주의)**: 네이버 SDK 초기화가 `consumerKey`+**`consumerSecret`**+`appName`을 요구한다 → **consumerSecret이 앱 번들에 박힌다**. 카카오(공개 네이티브키만)와 달리 secret이 클라에 노출되지만, **네이버 SDK 설계상 회피 불가**다(웹 OAuth로 우회하면 백엔드 access_token 계약과 어긋남). 그래서 `.env`(`EXPO_PUBLIC_NAVER_CONSUMER_SECRET`)로 주입하되 이 한계를 문서에 남긴다.
- 대안(버림): 웹 OAuth(expo-auth-session) — 카카오와 동일 이유로 기각(code→token 교환에 secret 필요, UX 브라우저 전환). 다른 네이버 RN 라이브러리 — 유지보수되는 게 사실상 없음.
- 관련: [auth.md](./auth.md), [dev-build.md](./dev-build.md), `app.config.ts`, `app/_layout.tsx`, `src/shared/domain/auth/socialAuth.ts`

## 2026-06-30 · 결정: 카카오 로그인 라이브러리 = `react-native-kakao`(mym0404)
- 맥락/문제: 카카오는 RN 공식 래퍼가 없어 서드파티 선택 필요. 후보는 다운로드·자료가 가장 많은 `@react-native-seoul/kakao-login`과 비교적 최신인 `react-native-kakao`(mym0404).
- 결정: **`react-native-kakao`(@react-native-kakao/core·user)** 채택.
- 이유: 이 프로젝트는 `react-native-reanimated v4`를 쓰는데 reanimated v4는 **New Architecture 전용** → 앱이 new arch가 강제로 켜진 상태. `@react-native-seoul`은 new arch 지원이 불명확(빌드/런타임 크래시 위험)하고, `react-native-kakao`는 New Architecture·Expo first-class 지원을 명시한다. "많이 쓰는 것"(seoul)보다 "우리 new arch 환경 호환"이 결정 요인.
- 대안(버림): `@react-native-seoul/kakao-login`(new arch 미보장), 웹 OAuth(expo-auth-session — 카카오/네이버는 code→token 교환에 client_secret 필요해 백엔드 access_token 계약과 어긋남).
- 관련: [auth.md](./auth.md), [dev-build.md](./dev-build.md), `app.config.ts`, `src/shared/domain/auth/socialAuth.ts`

## 2026-06-30 · 결정: 소셜 로그인 = 네이티브 SDK + dev build (어댑터로 격리)
- 맥락/문제: 백엔드 `POST /auth/:provider`는 클라가 받은 소셜 `access_token`(애플은 `identityToken`)을 그대로 받는다. 토큰을 어떻게 얻느냐(네이티브 SDK vs 웹 OAuth)와 빌드 방식 결정 필요.
- 결정: **네이티브 SDK**(@react-native-seoul/kakao-login·naver-login + expo-apple-authentication) + **dev build**. 소셜 토큰 획득부는 `socialAuth.ts`의 `getSocialToken(provider)` **어댑터로 격리**(현재 stub). 키·dev build 준비 전까지 골격만 구현.
- 이유: 네이티브 SDK가 백엔드 access_token 계약과 자연스럽고 카카오톡/네이버앱 연동·UX가 낫다. 어댑터로 격리하면 키/빌드 없이도 화면 배선·세션·로그아웃을 완성·검증하고, 나중에 어댑터 3곳만 교체하면 된다.
- 대안(버림): 웹 OAuth(expo-auth-session) — Expo Go에서 빠르나 카카오/네이버는 code→token 교환에 client_secret이 필요해 백엔드 계약과 어긋나고 UX가 브라우저 전환.

## 2026-06-29 · 결정: `app/index.tsx`를 `/` 진입 라우트로 둔다
- 맥락/문제: 화면용 `index.tsx`를 피하려 했으나, 네이티브 앱은 시작 시 `/`를 열어 진입 라우트가 없으면 스플래시에서 멈춤.
- 결정: `app/index.tsx`는 두되, 화면 로직 없이 `<Redirect href="/splash" />`만.
- 이유: 네이티브 진입 해결. 나머지 화면은 여전히 명시적 이름 사용.
- 대안(버림): `initialRouteName`만 사용(네이티브 진입 미해결), 화면용 index 남발(규칙 위반).

## 2026-06-29 · 결정: Expo SDK를 54로 고정
- 맥락/문제: 스토어 Expo Go가 SDK 54까지만 지원(`expoGoSdkVersion: 54.0.0`). 프로젝트는 56이라 실기기에서 거부됨.
- 결정: SDK 56 → 54 다운그레이드, `.npmrc`에 `legacy-peer-deps=true`.
- 이유: 무료로 실기기(Expo Go) 테스트 가능. 소셜 로그인(네이티브)용 dev build는 추후.
- 대안(버림): 56 유지(Expo Go 불가), 지금 dev build(유료 Apple 개발자 계정 필요).

## 2026-06-29 · 결정: 온보딩 Primary 색 = "Red" 스케일
- 맥락/문제: 디자인에 `Colors(Primary)` 표와 `Red` 표의 중간톤 값이 서로 달랐음.
- 결정: 실제 화면 컴포넌트가 쓰는 **Red 스케일**을 토큰의 primary로 채택.
- 이유: 디자인 화면과 100% 일치(예: 검색창 테두리 `#e17e9b` = red-300).
- 대안(버림): Primary 표 값(역할 설명은 자세하나 화면과 불일치).

## 2026-06-29 · 결정: 폰트는 렌더를 막지 않고 백그라운드 로드
- 맥락/문제: `useFonts` 완료까지 `return null` 하면 기기에서 스플래시 멈춤 위험.
- 결정: 폰트 백그라운드 로드 + 마운트 시 스플래시 즉시 해제.
- 이유: 멈춤 방지. 폰트는 준비되는 대로 적용(짧은 FOUC 허용).
- 대안(버림): 폰트 로딩 완료까지 렌더 차단.
