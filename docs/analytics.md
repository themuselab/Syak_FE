# analytics — GA4 계측 (웹 gtag, 앱 웹뷰 공용)

소비자 앱의 사용 이벤트를 GA4로 보낸다. 앱(iOS/Android)은 웹(`app.themuselab.kr`)을 띄우는 웹뷰 셸이라
**웹 빌드 하나가 gtag로 보내고**, 셸 안인지 아닌지는 이벤트 파라미터 `platform`으로 나눈다.
소비자 웹(www, `themuselab.kr`)과 **같은 GA4 속성 `G-Q0WLLSMTXM`** 을 쓰고, 웹과 겹치는 이벤트
(`shop_view`·`reserve_click`·`filter_apply`)는 이름·주요 파라미터를 웹과 맞췄다 → 웹/앱을 한 화면에서 비교.

> 예전(v1)엔 `@react-native-firebase/analytics`로 보내려다 Expo54/RN0.81 iOS 빌드 실패로 no-op이었다.
> 웹뷰 전환 뒤로는 네이티브 SDK가 필요 없어 gtag(스크립트 태그)로 바꿨다 — 새 npm 의존성 없음.

## 무엇을 / 어디에
| 파일 | 역할 |
|---|---|
| [`app/+html.tsx`](../app/+html.tsx) | 정적 export HTML head에 gtag 로더. `gtag('config', 'G-Q0WLLSMTXM', { send_page_view: false })` — 화면 조회는 `app_screen_view`로 직접 보낸다. expo-router 기본 Html과 같고 gtag만 추가(화면 변화 없음). 웹 빌드에서만 쓰이고 네이티브 번들(`index.native.tsx` → 셸)엔 안 들어간다. |
| [`src/shared/lib/gaConfig.ts`](../src/shared/lib/gaConfig.ts) | 측정 ID 상수(의존성 없음 — 정적 렌더에서도 import 안전). |
| [`src/shared/lib/analytics.ts`](../src/shared/lib/analytics.ts) | 단일 진입점 `track(name, params)` + 헬퍼(`track.shopView` 등), `initAnalytics()`, `setAnalyticsUserId()`, `markShopSource()`. 모든 호출은 fire-and-forget·try/catch — gtag가 없거나(광고 차단·네이티브) 실패해도 조용히 넘어간다. |
| [`src/screens/home/useHomeAnalytics.ts`](../src/screens/home/useHomeAnalytics.ts) | 홈 목록 계측(shop_list_view·search·search_no_result·filter_apply)과 조합 단위 중복 제거. |

### 모든 이벤트의 공통 파라미터 (`trackCore`)
| 파라미터 | 값 |
|---|---|
| `platform` | 셸 안이면 `window.__SYAK_SHELL__.platform`(`ios`/`android`), 아니면 `web` (`bridgeClient.shellInfo()`) |
| `app_version` | 셸 앱 버전(`__SYAK_SHELL__.version` = 셸의 `expoConfig.version`). 일반 브라우저면 없음 |
| `anonymous_id` | 설치 단위 익명 ID(`deviceId.ts`, 웹에선 localStorage). 비동기라 `initAnalytics`가 한 번 읽어 캐시 — 읽히기 전(첫 화면의 첫 1~2개 이벤트)엔 빠진다. 같은 값을 GA **user_property `anonymous_id`** 로도 심는다. |
| `event_id` | 이벤트마다 랜덤 UUID(v4). gtag가 GA4 예약 필드로 인식해 collect 요청엔 `evnid`로 실린다(중복 제거용). |

### user_id
- **값은 내부 유저 UUID(`AuthUser.id`)만.** 이메일·전화·닉네임은 절대 보내지 않는다.
- `initAnalytics`가 auth store(`useAuthStore`)를 구독해 `gtag('set', { user_id })`로 맞춘다 — 스플래시 세션 확인(`getMe`)·소셜 로그인 성공 시 설정, 로그아웃·세션 만료(`setUser(null)`) 시 `null`로 해제.
- 소셜 로그인 성공 직후엔 `useSocialLogin.onSuccess`가 `sign_up`/`login` **전에** 직접 설정해 그 이벤트부터 유저에 붙는다.

## 이벤트 명세
"1회" 규칙 = 같은 일이 한 번 일어나면 이벤트도 한 번. 리렌더·스크롤·다음 페이지 로드로는 다시 나가지 않는다.

| 이벤트 | 발생 조건 | 파라미터(공통 제외) | 중복 제거 | 발생 위치 |
|---|---|---|---|---|
| `app_first_open` | 셸(iOS/Android 앱) 안에서 처음 실행 | (공통만: platform·app_version) | AsyncStorage 키 `syak.analytics.firstOpenSent` — 설치당 1회(앱 삭제·재설치 시 다시 1회). 일반 브라우저에선 안 보냄 | `analytics.ts` `initAnalytics` |
| `sign_up` | 소셜 로그인 성공 + 응답 `isNewUser === true` (BE `POST /auth/:provider`가 201과 함께 내려줌) | `signup_method`(kakao·naver·apple), `method`(GA 권장 이름) | 로그인 mutation 성공 1회당 1번 | `auth.queries.ts` `useSocialLogin.onSuccess` |
| `login` | 소셜 로그인 성공 + `isNewUser === false` | `login_method`, `method` | 위와 같음 | 같은 곳 |
| `neighborhood_set` | 관심 동네 저장(`PATCH /notifications/settings`) 성공 — 홈 안내 시트·마이 어디서 골라도 | `region`(동 이름), `region_code`, `action`(`set`=처음 / `change`=바꿈) | 저장 성공 1회당 1번 | `interestRegion.ts` `setRegion` |
| `shop_list_view` | 검색어 없는 홈 목록이 새 조합으로 보일 때(응답 도착 후 800ms 안정) | `category`(시술 분야 라벨·`partner`·`all`), `region`(결과에 가장 많은 구), `filter`(필터 요약, 없으면 `none`), `result_count` | 직전에 보낸 `category|region|filter` 조합과 같으면 안 보냄(모듈 변수 — 상세 다녀와 홈이 다시 마운트돼도 유지). 지도 이동은 결과의 대표 구가 바뀔 때만 새 조합 | `useHomeAnalytics.ts` |
| `search` | 비어 있지 않은 검색어(기존 300ms 디바운스 후)의 결과 도착 + 800ms 안정 | `search_term`(소문자·trim·30자 자름), `search_term_length`, `has_category`, `category`, `region`(결과 대표 구), `result_count` | 직전 `검색어|category` 조합과 같으면 안 보냄 | `useHomeAnalytics.ts` |
| `search_no_result` | 위 `search`의 결과가 0건 | `search`와 같음 | `search`와 함께 1회 | `useHomeAnalytics.ts` |
| `filter_apply` (웹과 같은 이름) | 필터(정렬·가격·예약시간·당일예약/할인 토글)가 새 조합으로 800ms 안정. 앱 필터는 고르는 즉시 반영되고 "적용하기"는 닫기만 해서 버튼이 아니라 상태 변화로 잡는다 | `source`(웹과 같은 요약 문자열, 예 `정렬:review,가격:2-5,당일예약`), `filter`(같은 값) | 직전 요약과 같으면 안 보냄. 전부 해제(`none`)는 안 보냄 | `useHomeAnalytics.ts` |
| `shop_view` (웹과 같은 이름) | 샵 상세 라우트 `/shop/[id]` 또는 홈 포커스 시트가 샵 데이터를 받았을 때 | `shop_id`, `category`, `region`(구), `source`(`list`·`pin`·`push`·`favorite`·`notification`·`direct`), 웹 측정기준 호환용 `shop_category`·`shop_district` | 마운트당 샵 id 1회(effect deps = 샵 id) | `ShopDetailScreen.tsx`, `ShopDetailSheet.tsx` |
| `slot_list_view` | "예약 가능 시간" 섹션이 화면에 들어옴(스크롤스파이 활성 탭 = 예약) / 날짜 탭을 바꿈 | `shop_id`, `day`(`today`·`tomorrow`·`day_after`), `slot_count`(그날 빈자리 시각 수), `trigger`(`shown`·`tab`) | `shown`: 화면 인스턴스·샵당 1회, 슬롯 응답 도착 후(0건 오집계 방지). `tab`: 다른 탭을 누를 때마다(같은 탭 재탭 무시) | `ShopDetailBody.tsx` (+ `AvailabilitySection` `onSelectDay`) |
| `slot_detail_view` | **해당 없음** — "예약 가능 시간"은 시각을 텍스트(`15:00 · 15:30`)로 나열할 뿐 개별 시각을 누르는 UI가 없다. 만들지 않았다 | — | — | — |
| `reserve_click` (웹과 같은 이름) | 하단 예약 바의 온라인 예약 버튼(네이버·카카오·톡톡) 또는 "전화예약" 누름 | `shop_id`, `reservation_method`(naver·kakao·talktalk·phone), 웹 호환 `route`(같은 값). `slot_date`/`slot_time`은 **없음** — 예약 버튼이 특정 시각 선택과 연결돼 있지 않다 | 누를 때마다 1회 | `ShopDetailScreen.tsx`, `ShopDetailSheet.tsx` (`ReservationBar.onReserveClick(method)`) |
| `favorite_add` / `favorite_remove` | 별 토글이 서버에 반영됨(onSuccess) | `shop_id` | 성공 1회당 1번(연타는 기존 `pendingRef`가 막음). 409/404(이미 그 상태)는 집계 안 함 | `favorite.queries.ts` `useToggleFavorite` |
| `slot_alert_created` | 빈자리 알림 신청 `POST /notifications/slot-alerts` 성공 | `shop_id`, `date`, `time_count` | 성공 1회당 1번 | `slotAlert.queries.ts` `useCreateSlotAlerts` |
| `push_permission_granted` | 권한 요청 직후 허용으로 확인됨: ① 앱 시작 시 셸 `getPushToken`(권한 없으면 OS 팝업) 전엔 꺼져 있었는데 토큰이 나옴 ② 마이 "알림" 토글을 켜서 `true`가 돌아옴 | `trigger`(`startup`·`settings_toggle`) | 세션(페이지 로드)당 1회(`trackOnce`) | `push.ts` `getPushToken`, `MyScreen.tsx` |
| `push_opened` | 앱이 켜진 상태에서 알림을 눌러 셸이 `navigate` 이벤트를 보냄 | `shop_id`(경로가 `/shop/:id`일 때), 아니면 `path` | navigate 이벤트 1회당 1번. 이어지는 `shop_view`의 source는 `push` | `app/_layout.tsx` |
| `app_screen_view` | 주요 화면 진입: home·shop_detail·notifications·my·favorites(라우트 변경), login(로그인 패널이 펼쳐질 때 — `/login`과 비로그인 `/splash` 공통) | `screen_name` | 라우트(pathname) 변경당 1회 / 로그인은 마운트당 1회 | `app/_layout.tsx`(`track.screen`), `LoginScreen.tsx` |
| `region_select` | **해당 없음** — 웹의 구(지역) 필터 선택에 해당하는 UI가 앱에 없다. 앱의 지역 선택(관심 동네)은 `neighborhood_set` | — | — | — |

### shop_view `source` 판정
이동 직전에 호출부가 `markShopSource(shopId, source)`로 적어 두고, 같은 샵의 `shop_view`가 가져간다(30초 지나면 버림).
URL에 흔적을 남기지 않아 공유 링크·화면이 그대로다.
- 홈 목록 카드 탭 → `list` / 지도 핀 탭(시트·라우트 모두) → `pin` (`HomeScreen.tsx`)
- 즐겨찾기 목록 → `favorite` (`FavoriteScreen.tsx`)
- 알림함(샵 알림·빈자리 알림 신청 현황) → `notification` (`NotificationScreen.tsx`, `SlotAlertRequests.tsx`)
- 셸 `navigate`(알림 탭, 앱 켜진 상태) → `push` (`_layout.tsx`)
- 그 외(주소 직접 진입·새로고침·종료 상태에서 알림으로 켜짐) → 라우트 `direct` / 시트 `list`

### 검색어 개인정보 판단
홈 검색창은 매장·동네·시술 이름을 찾는 상자라 원문을 보내되, 소문자·trim 후 **30자에서 자른다**(긴 자유 입력에 섞일 수 있는 개인정보 차단). 길이는 `search_term_length`로 따로 보낸다.

## GA 쪽 참고
- **향상된 측정(enhanced measurement)** 은 스트림 설정이라 www와 공유된다 → 앱에서도 라우트 변경 시 자동 `page_view`, `scroll`, `user_engagement`가 나간다(우리 공통 파라미터 없음). `send_page_view: false`는 첫 로드 page_view만 끈다. 앱 화면 분석은 `app_screen_view`를 쓰고, 자동 이벤트는 호스트명(`app.themuselab.kr`)으로 거른다.
- 새 파라미터(`platform`·`app_version`·`anonymous_id`·`source`·`reservation_method`·`category`·`region`·`day`·`slot_count`·`trigger`·`search_term_length`·`result_count`·`action` 등)를 보고서에서 쓰려면 GA4 관리 → 맞춤 정의에 **이벤트 범위 맞춤 측정기준/측정항목**으로 등록해야 한다. `anonymous_id`는 사용자 범위.
- GA4 자체 `first_visit`/`session_start`는 그대로 자동 수집된다. `app_first_open`은 "앱 설치 후 첫 실행"만 따로 센다.

## 남은 작업 / 후속
- **종료 상태에서 알림으로 켜진 경우의 `push_opened`** (cold start): 셸(`WebViewShell`)이 `getLastNotificationResponseAsync`로 받은 경로를 그대로 `${origin}/shop/:id`로 열어서 웹이 일반 진입과 구분할 수 없다. 셸이 시작 주소에 `?from=push` 같은 표시를 붙이고 웹이 그걸 읽어 `push_opened` + source `push`로 보내야 한다 — 셸 네이티브 변경(앱 재빌드·스토어 배포)이 필요해 이번엔 웹 쪽(앱 켜진 상태)만 구현했다.
- 마이 "알림" 토글에서 이미 거부돼 설정 앱으로 보내진 뒤 허용한 경우는 `push_permission_granted`로 잡히지 않는다(돌아와서 포커스 재조회라 요청 직후가 아님).
- `slot_detail_view`는 개별 시각을 누르는 UI가 생기면 추가.

## 검증 방법
1. `npx tsc --noEmit`
2. `npx expo export --platform web --output-dir <dir>` → `<dir>/home.html` head에 `googletagmanager.com/gtag/js?id=G-Q0WLLSMTXM`와 `send_page_view:false` 스니펫이 있는지.
3. 로컬 서빙(포트 8081 — API CORS 허용 오리진) 후 브라우저 DevTools Network에서 `google-analytics.com/g/collect` 요청의 `en=`(이벤트명)·`ep.*`(파라미터)·`uid`(user_id)·`up.anonymous_id`를 확인. 셸 흉내는 페이지 로드 전에 `window.__SYAK_SHELL__ = { platform: 'android', version: '1.0.1', insets: {...} }`와 `window.ReactNativeWebView = { postMessage }`를 심으면 된다.
4. 실서비스: GA4 DebugView(또는 실시간)에서 `platform`별로 확인.
