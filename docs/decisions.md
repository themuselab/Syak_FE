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

## 2026-07-10 · 결정: 내 주변 모드 표시 = locationOverlay 마커(토글 시점 1회 고정) + 버튼 아이콘 #007AFF
- 맥락/문제: 내 주변 토글(2026-07-05)은 모드 표시 UI 없이 목록만 바뀌어 "내 위치 기준 탐색 중"임을 알 수 없다는 피드백. 디자인 도착(`design.pen` `wMGlf` 내위치 마크업 — 파란 점 마커 32px). 단, 버튼 활성 상태 색은 디자인에 정의 없음.
- 결정(사용자 확정): ① 마커는 `NaverMapView` 내장 **`locationOverlay`**로 표시(커스텀 PNG `assets/icons/marker-my-location.png`, pen 노드 3배수 export) ② 좌표는 **토글 시점 1회 고정**(실시간 추적 안 함) ③ 버튼 활성 색 = **#007AFF**(마커와 통일, `colors.myLocation` 토큰 신설, 아이콘만 변경) ④ 해제 시 마커 숨김·색 원복.
- 이유: locationOverlay는 SDK가 "사용자 현재 위치" 용도로 제공하는 전용 오버레이(지도당 1개 보장, 샵 핀과 z-순서 충돌 없음). 토글 시점 고정은 목록 검색 기준 좌표(`nearbyCoords`)와 마커가 항상 일치 — 실시간 추적이면 마커와 검색 기준이 어긋나고 watchPosition 배터리 비용 발생. #007AFF는 마커 색과 동일해 "내 위치" 계열로 직관적(iOS 표준 위치 색).
- 대안(버림): 일반 `NaverMapMarkerOverlay`로 직접 렌더(전용 오버레이가 있는데 중복), 실시간 추적(검색 기준 불일치·배터리), 브랜드 핑크 활성 색(즐겨찾기·강조 요소와 겹침 — 사용자 확정으로 파랑).
- 관련: `HomeMap.tsx`, `CurrentLocationButton.tsx`, `tokens.js`, [home.md](./home.md) §3 내 주변

## 2026-07-05 · 결정: FCM 토큰 = @react-native-firebase/messaging (expo-notifications 아님)
- 맥락/문제: 푸시 셋업 시 라이브러리 선택. 기존 계획(notification.md §9)은 Expo 생태계 기본인 expo-notifications였음. 백엔드는 `notification_settings.fcm_token`에 저장된 **FCM 등록 토큰**으로 firebase-admin이 직접 발송하는 구조(Expo push 서비스 미경유).
- 결정: `@react-native-firebase/app` + `@react-native-firebase/messaging`(v25, config plugin + iOS static frameworks). 토큰 등록은 `push.ts`의 `usePushSetup()`(로그인 전환 시) → 권한 → `getToken()` → PATCH settings. 로그아웃은 `deleteToken()`으로 기기 무효화(서버 토큰 삭제 API 없음 — COALESCE 한계, BE 전달). google-services 파일은 .gitignore + EAS file env, app.config.ts에서 파일 존재 시에만 plugin 포함(조건부 패턴 유지).
- 이유: expo-notifications의 `getDevicePushTokenAsync()`는 **iOS에서 APNs 토큰**을 반환 — 백엔드가 FCM 토큰으로 발송하므로 iOS 푸시가 불가능해짐. RNFirebase `getToken()`은 양 플랫폼 모두 FCM 토큰(백엔드 개발자 가이드와 일치).
- 대안(버림): expo-notifications(iOS 토큰 불일치), Expo Push Service 경유(백엔드 재작업 필요 — BE는 이미 firebase-admin 완성), 포그라운드 배너용 notifee 추가(범위 외 — 디자인·정책 확정 후).
- 관련: `src/shared/domain/notification/push.ts`, `app.config.ts`, [notification.md](./notification.md) §9

## 2026-07-05 · 결정: 내 주변 매장 = 현재위치 버튼 토글 + 서버 lat/lng, 모드 표시 UI 없음 (→ 표시 UI는 2026-07-10 항목으로 대체)
- 맥락/문제: 2026-07-04 백엔드 배포로 `GET /shops?lat&lng&radius`(bounding box, 기본 5km) 필터가 생김. 기존 현재위치 버튼은 지도 카메라만 이동하고 목록은 전국 그대로. "내 주변" 노출 방식에 대한 디자인 없음.
- 결정(사용자 확정 3건): ① 현재위치 버튼을 **토글**로 — 누르면 카메라 이동+목록·핀을 내 주변으로, 다시 누르면 해제(카메라 유지·위치 재조회 없음) ② `radius` 미전송(서버 기본 5km) ③ 칩·버튼 상태 등 **모드 표시 UI 없음**(목록만 변경). `nearbyCoords`는 필터 store가 아닌 **HomeScreen 로컬 state**로 두고 `listParams`에 병합.
- 이유: 새 화면·디자인 없이 기존 버튼의 자연스러운 확장. params가 queryKey라 병합 한 줄로 1페이지 리셋·무한스크롤·필터 AND 조합·핀 갱신이 전부 기존 로직으로 동작. 필터 store 편입은 필터 화면과 무관한 상태라 과함(초기화 버튼과 얽히는 의미 결정도 불필요해짐 — 해제는 버튼으로만).
- 대안(버림): 필터 store 편입(리셋 의미 얽힘), '내 주변' 칩 추가(사용자가 표시 없음 확정 — 디자인 나오면 재검토), radius 명시 전송(기본값 정책이라 불필요).
- 관련: `HomeScreen.tsx`, `shops.types.ts`/`shops.api.ts`, [home.md](./home.md) §3 내 주변

## 2026-07-04 · 결정: 즐겨찾기 서버 연동 = 단일 캐시 + 낙관적 업데이트, 409/404는 성공 취급
- 맥락/문제: 홈(로컬 Set)·상세(별개 boolean)의 별 상태가 화면별로 분리돼 비동기화. 샵 목록/상세 API에 `isFavorite` 필드가 없어 즐겨찾기 여부를 서버가 알려주지 않음. BE 문서(04-favorite.md)는 낙관적 업데이트+롤백을 명시 권장.
- 결정: `['favorites','list']` 캐시(GET /favorites 응답 원형)를 **단일 소스**로 두고 별 여부는 `select` 파생 Set으로 판정(홈↔상세 자동 동기화). 토글은 `useToggleFavorite` — 낙관 반영 후 실패 시 **해당 샵만 역연산 롤백**, 409(이미 있음)/404(이미 없음)는 성공 취급(invalidate 1회), 같은 샵 연타는 in-flight 가드로 무시. 비회원 별 탭은 `LoginPromptModal`(로그인 이동은 모달 닫은 뒤 push). 로그아웃 시 favorites/notifications 캐시 제거(계정 교체 오염 방지).
- 이유: isFavorite 부재 상황에서 전체 목록 1회 대조가 유일·충분한 방법(개인당 수십 개 수준). 낙관 업데이트로 기존 로컬 토글의 즉각 반응성 유지. 전체 스냅샷 롤백은 동시 토글을 덮어써서 샵 단위 역연산 채택.
- 대안(버림): invalidate-only(별 반응 지연), 전체 스냅샷 롤백(동시 낙관 반영 덮어씀), 연타 큐잉(409/404 성공 처리와 얽혀 복잡도만 증가), 실패 토스트(인프라 부재 — 조용히 원복).
- 관련: `src/shared/domain/favorite/*`, `HomeScreen.tsx`, `ShopDetailScreen.tsx`, `auth.queries.ts`, [home.md](./home.md) §3

## 2026-07-03 · 결정: 알림 연동 범위 = 목록+설정만, FCM 푸시 셋업은 백엔드 수정 후로 연기
- 맥락/문제: 알림 기능 연동 시점에 백엔드 FCM이 Google이 2024-06 종료한 레거시 API(`fcm/send`)로 짜여 있어 푸시 발송 자체가 불가(syakBE 수정은 우리 범위 밖). 앱에도 푸시 인프라(expo-notifications·Firebase 설정) 전무.
- 결정: 이번엔 GET /notifications 목록 + GET/PATCH settings 연동까지만. 앱 푸시 셋업(expo-notifications + google-services + EAS 재빌드)은 **백엔드 FCM v1 마이그레이션 일정이 잡히면 애플 로그인 어댑터 재빌드와 묶어** 진행. 읽음 처리는 BE API 미노출이라 미읽음 뱃지 표시만.
- 이유: 지금 셋업해도 "권한 팝업+토큰 등록"까지만 확인 가능한 반쪽 검증. 백엔드와 발맞춰 한 번에 끝까지 검증 + EAS 빌드 횟수(월 15회) 절약.
- 대안(버림): 푸시 인프라 선셋업(반쪽 검증 상태로 방치), 클라 로컬 읽음 처리(기기 바꾸면 초기화 — BE API 대기가 나음).
- 관련: [notification.md](./notification.md) §9, `src/shared/domain/notification/*`

## 2026-07-03 · 결정: 설정 PATCH 캐시 갱신 = invalidate 대신 setQueryData 교체
- 맥락/문제: 알림 설정 PATCH 후 화면 값 갱신 방법 — 코드베이스에 mutation+캐시 갱신 선례 없음. 낙관적 업데이트/롤백은 코드가 무거움.
- 결정: PATCH 응답이 **변경된 전체 설정 객체**이므로 `onSuccess`에서 `setQueryData(['notifications','settings'], data)`로 캐시 직접 교체. 토글 값은 서버(캐시) 파생으로만 렌더.
- 이유: 추가 GET 없이 정확한 최신 상태 반영. 실패 시 캐시가 안 바뀌므로 토글이 자동으로 원위치 — 롤백 코드 자체가 불필요.
- 대안(버림): invalidateQueries(불필요한 재조회 1회), 낙관적 업데이트(onMutate/onError 롤백 코드 — 이 UX에선 과함).
- 관련: `notification.queries.ts`, `MyScreen.tsx`

## 2026-07-03 · 결정: 지역 목록 = 실데이터 gu 고유값 스냅샷 하드코딩 (+'경상' 탭)
- 맥락/문제: 지역 필터가 mock 행정구역을 보내 서울 외 지역이 전부 0건(실값 "인천 부평구" vs 전송 "부평구"). 백엔드에 지역 목록 API 없음. 저장 형식도 제각각(서울=구만, 광역시=`시 구`, 경기·지방=시/군만).
- 결정: Supabase `shops.gu` 고유값 **89개 전수 스냅샷**(2026-07-03)을 `src/shared/lib/region.ts`에 하드코딩. 칩은 label(구/시), 서버엔 value(원값) 전송. 디자인 탭 7개에 **'경상' 탭 추가**(진주·창원·포항 ~2,200개 매장 — 사용자 확정). 주소 표기는 region("서울" 고정 버그) 대신 district 기반 `formatDistrict`(서울 구만 "서울 " 접두).
- 이유: 실값 전송이 0건 버그의 유일한 해결. 지역은 사실상 정적 데이터라 스냅샷으로 충분.
- 대안(버림): 런타임 전수 조회(40k행 41요청 — 낭비), 백엔드 지역 API 대기(막힘), 접두 규칙 추론만(경기 "광주시" vs 광역시 "광주 동구" 같은 함정).
- 관련: `src/shared/lib/region.ts`, `RegionFilterContent.tsx`, [home.md](./home.md), [troubleshooting.md](./troubleshooting.md)

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

## 2026-06-30 · 결정: 홈 즐겨찾기 1차 로컬 토글 (API는 로그인 후) — ✅ 2026-07-04 서버 연동으로 대체됨(맨 위 항목)
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
