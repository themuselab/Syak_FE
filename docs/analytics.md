# analytics — GA4 계측 (Firebase Analytics)

앱 사용 이벤트를 GA4로 보낸다. 소비자 웹(gtag, 속성 `G-Q0WLLSMTXM` = "Syak")과 **이벤트 이름을 맞춰** 웹+앱 통합 퍼널을 만든다.

## 무엇을 / 어디에
- **전송 수단**: `@react-native-firebase/analytics` (네이티브). Firebase 프로젝트가 GA4 속성에 앱 스트림으로 자동 연결됨.
- **래퍼**: [`src/shared/lib/analytics.ts`](../src/shared/lib/analytics.ts) — `track.*` 헬퍼. 카카오/네이버/FCM과 동일한 **dynamic import 가드**라 web·Expo Go·google-services 미포함 빌드에선 조용히 no-op(앱 안 깨짐). 전부 fire-and-forget.
- **플러그인/의존성**: `app.config.ts`의 `firebasePlugins`에 `@react-native-firebase/analytics` 추가(google-services 존재 시에만). `package.json` dep 추가.

## 이벤트 (웹과 동일 이름 → 통합 퍼널)
| 이벤트 | 파라미터 | 발생 지점 |
|---|---|---|
| `screen_view` | screen_name, screen_class | `app/_layout.tsx` — `usePathname` 변경 시 |
| `shop_view` | shop_id, shop_name | 샵 상세 진입 — `ShopDetailScreen`, 홈 바텀시트 `ShopDetailSheet` |
| `reserve_click` | shop_id, method(예약수단 라벨) | 예약바 클릭 — 두 화면의 `onReserveClick` (기존 서버 `postReservationClick`과 병행) |
| (헬퍼 준비) `map_pin_click` / `region_select` / `filter_apply` | — | 아직 미배선(후속) |

> `shop_id`는 웹과 같은 GA4 맞춤 측정기준. `shop_view`→`reserve_click`이 웹 SEO 퍼널(`seo_landing`→`seo_cta_click`→`shop_view`→`reserve_click`)의 뒷단과 이어진다.

## ⚠️ 적용 조건 (중요)
- **네이티브 모듈이라 재빌드 필요**: 기존 dev client에 핫리로드로는 안 붙는다. `@react-native-firebase/analytics` 추가 후 **dev client / EAS 재빌드**해야 실제 전송된다. (web·Expo Go에선 가드로 no-op)
- **GA4 속성 연결 확인**: 앱 이벤트가 웹과 **같은 "Syak" 속성**에 쌓이려면 Firebase 프로젝트가 그 GA4 속성에 연결돼 있어야 한다(Firebase 콘솔 → Integrations → Google Analytics). 별도 속성이면 앱/웹 퍼널이 분리된다.
- **디버그 검증**: `adb shell setprop debug.firebase.analytics.app <package>` 후 GA4 DebugView에서 실시간 확인.

## 남은 작업
- map_pin_click / region_select / filter_apply 배선(헬퍼는 준비됨).
- first_open·session_start 등은 Firebase 자동 이벤트로 수집(별도 코드 불필요).
