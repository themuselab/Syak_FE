# 홈 (지도뷰)

> 상태: **UI + 백엔드 샵 연동(실시간 Supabase 4만 매장) + 네이버 지도 실기기(dev build) 검증 완료.** 검색·정렬·카테고리 8종은 서버 필터, 예약시간은 `/slots/search` 교집합(~~단 슬롯 API는 백엔드 42703 버그로 수정 대기 — §4~~ → **2026-07-04 백엔드 수정 배포로 해소 — 예약시간 필터 실동작 재검증 완료**).
> 홈은 **비회원도 접근**(`/shops` 무인증). 디자인: `designs/홈지도뷰/*`, `design.pen` 프레임 `GhhI1`(메인)·`aMGlg`(정렬)·`T7ZAb7`(지역)·`ykdR2`(가격)·`S5sgV5`(예약시간)·`Ib0Re`(시술)·`FvUT4`(빈 상태).

## 1. 구성
- **헤더**: 로고 + 알림/프로필. 벨 → `/notifications`, 유저 → `/my`.
- **검색바**: pill, 핑크 테두리. 이름 검색(`store.search`) — **서버 `q` 파라미터**(ilike 부분검색). 타이핑마다 refetch하지 않도록 **300ms 디바운스**(`useDebouncedValue`).
- **지도**: `HomeMap`(네이버지도 `NaverMapView`) + 샵 좌표 핀. **핀 탭 → 바텀시트에 그 매장 미리보기(카드 1개, 시트 40%로)** → 카드 탭 또는 시트를 위로 크게 올리면(90%) `/shop/:id` 상세 진입. **지도 빈 곳 탭 → 미리보기 해제**(전체 목록 복귀). web/Expo Go/키 없음은 회색 placeholder(`HomeMap.web.tsx` + 키 가드).
- **현재위치 버튼 = 내 주변 토글(2026-07-05)**: 지도 우하단. 누르면 `expo-location` 권한 → 좌표 → 지도 카메라 이동(`HomeMap` ref `moveTo`) + **목록·핀을 내 주변 매장으로 필터**(`GET /shops?lat&lng`, 반경 서버 기본 5km). **다시 누르면 해제**(전체 목록, 카메라 유지). **모드 표시(2026-07-10 피드백 반영)**: 지도에 내 위치 마커(파란 점, `locationOverlay`) + 버튼 아이콘 파랑(`#007AFF`) 전환, 해제 시 원복. 권한 거부 시 무동작 — §임시 동작.
- **바텀시트**: 드래그(40%↔90%), 칩바(고정) + 매장 목록 / 미리보기(핀 선택 시 카드 1개) / 로딩 / 에러 / 빈 상태. 목록 하단·필터 닫기 버튼은 **safe area bottom inset 반영**(안드 내비 바에 안 가림).
- **매장 카드**: 썸네일(`photos[0]`) + 이름·**리뷰수(`리뷰 N`)**·주소·배지·즐겨찾기 별.
- **필터**: 같은 바텀시트 안에서 내용 전환(별도 모달 아님). 칩 탭 → 필터 화면, 닫기 → 목록.

## 2. 파일 구조
```
app/home.tsx                         # 라우트 → HomeScreen
src/screens/home/
  HomeScreen.tsx                     # 조립 + useShops(+useSlotSearch 교집합) + favorite 서버 캐시 파생
  useHomeFilterStore.ts              # zustand 필터 상태 (HomeFilterState export)
  filtersToParams.ts                 # ★ 필터 store → GET /shops 쿼리 파라미터 어댑터
  shopToView.ts                      # ★ 백엔드 ShopListItem → 카드/마커 뷰모델(ShopCardView) 어댑터
  components/
    HomeMap(.tsx 네이티브/.web.tsx placeholder) · HomeHeader · SearchBar · CurrentLocationButton
    FilterChip · FilterChipBar · ShopBottomSheet · ShopListCard · ShopListEmpty · ShopListError
    filters/ FilterView · SelectChip · Sort/Price/Time/Service/RegionFilterContent
src/shared/domain/shops/
  shops.types.ts                     # ShopListItem/ShopDetail/ShopListResponse/ShopListParams(+enum)
  shops.api.ts                       # getShops(params)·getShop(id), 쿼리스트링 빌더
  shops.queries.ts                   # useShops(params)·useShop(id)
```
- 마커 핀 PNG: `assets/icons/pin-{partner,discount,reservable}.png`. `shopToView.markerKind`(isPartner→partner / eventDesc→discount / else reservable)와 직결.
- 내 위치 마커 PNG: `assets/icons/marker-my-location.png` — `design.pen` 프레임 `wMGlf`(내위치 마크업)의 `markup_my` 노드를 3배수 export(102px, 그림자 여백 포함). 지도에는 `NaverMapView`의 `locationOverlay`(SDK 내 위치 전용 오버레이, 지도당 1개)로 32dp 표시.

## 3. 데이터/필터 로직
- **목록**: `useShops(params)` — `params`는 `filtersToParams(store)`. **무한스크롤**: `useInfiniteQuery`(`limit:20`, `getNextPageParam`은 서버 응답 `total/page/limit`로 계산) + 리스트 `onEndReached`(threshold 0.5)로 다음 페이지 누적, footer 스피너. 지도 핀도 로드된 페이지까지의 샵만 표시. params(page 제외)가 queryKey라 필터 변경 시 1페이지부터 리셋. 페이지 flat 후 id 중복 제거(offset 페이지네이션 중복 대비). **예외**: 시간 필터 활성 시 `/slots/search` 교집합이 페이지 단위로 잘리지 않게 `limit:100` 단일 조회(무한스크롤 비활성 — 100개 초과 결과 미표시는 기존과 동일 한계).
- **필터 store → 백엔드 파라미터 매핑** (`filtersToParams.ts`):

| store | → GET /shops |
|---|---|
| `search`(300ms 디바운스) | `q` (서버 ilike) |
| `sort` price_asc/price_desc/partner | `sort` (default만 생략) |
| `regions[]` (실데이터 gu 원값 — `@/shared/lib/region.ts` 스냅샷 89개, '경상' 탭 포함) | `districts` |
| `price` '1'/'2'/'3' | `price_tiers=['N만원대']` |
| `toggles.discount` | `has_event=true` |
| `toggles.sameDay` \|\| `toggles.available` | `has_slot=true` (백엔드에 둘 구분 없음) |
| `serviceFields` ∩ 8종(네일·헤어·왁싱·반영구·속눈썹·마사지·피부·태닝) | `categories` |
| `date`(시간만 선택 시 '오늘'로 간주) | `slot_date=YYYY-MM-DD` |
| 세부 `services` | **보류**(백엔드 미지원, UI만 유지) |

- **예약시간(날짜+시간) 필터**: `times` 선택 시 `toSlotSearchParams` → `GET /slots/search?dates=&times=&districts=`(다중 시간 지원)로 가능 샵 ID를 받아 **목록과 클라 교집합**(HomeScreen). 시간 미선택(날짜만)은 `slot_date` 서버 필터로 충분해 호출 안 함. slots/search 로딩·에러는 목록 로딩·에러 상태에 합류(재시도 시 둘 다 refetch).

- **내 주변(2026-07-05)**: 현재위치 버튼 토글. `nearbyCoords`는 **필터 store가 아닌 HomeScreen 로컬 state**(필터 화면과 무관한 홈 전용 상태) — `listParams` useMemo에서 `lat`/`lng`로 병합(`radius` 미전송 = 서버 기본 5km, 사용자 확정). params가 queryKey라 토글 시 1페이지 리셋, 무한스크롤·다른 모든 필터와 AND 조합(백엔드 bounding box + `count exact`)·핀·선택 해제까지 기존 로직 그대로 동작.
  - **모드 표시(2026-07-10, 피드백 디자인 반영)**: ~~표시 UI 없음~~ → 지도에 **내 위치 마커**(`locationOverlay`, 토글 시점 좌표 1회 고정 — 실시간 추적 안 함, 목록 검색 기준과 항상 일치·사용자 확정) + **버튼 아이콘 파랑 `colors.myLocation`(#007AFF, 마커 색과 통일 — 사용자 확정)**. 해제 시 마커 숨김·색 원복. 디자인: `design.pen` `wMGlf` + `designs/피드백반영 디자인/내위치 마크업.png`(단, 버튼 활성 색은 디자인에 정의 없어 사용자 확정 값).
  - **임시 동작**: 위치 권한 거부·실패 시 안내 없이 무동작(모드 안 켜짐 — 마커·색상 변화 없음).

- **뷰모델 변환**(`shopToView.ts`): 주소=`formatDistrict(district)`(region은 백엔드 "서울" 고정 버그로 미사용 — 서울 구만 "서울 " 접두), badges=`eventDesc`+`priceTier`, markerKind=`isPartner→partner / eventDesc→event / else default`, favorite=`useFavoriteShopIds` 서버 캐시 파생 Set.
- **즐겨찾기**: `/favorites` **서버 연동 완료(2026-07-04)** — `src/shared/domain/favorite/` (types/api/queries).
  - 상태 소스는 `['favorites','list']` 캐시 하나(GET 응답 원형). 별 여부는 `useFavoriteShopIds(isLoggedIn)`의 `select` 파생 Set으로 판정(샵 API에 isFavorite 없음 — §4-6). **홈↔상세가 같은 캐시라 자동 동기화.**
  - 토글은 `useToggleFavorite()` — **낙관적 업데이트**(탭 즉시 반영) + 실패 시 해당 샵만 역연산 롤백. 409(이미 있음)/404(이미 없음)는 성공 취급(invalidate 1회). 같은 샵 연타는 in-flight 가드로 무시.
  - **비회원 별 탭 → `LoginPromptModal`** (visible state 제어, "로그인하러 가기"는 모달 닫은 뒤 push — 모달이 로그인 화면 덮는 함정 방지). 비회원은 별 항상 꺼짐(`GET /favorites` 미호출, enabled:false).
  - 로그아웃 시 `useSignOut`이 favorites/notifications 캐시 제거(계정 교체 시 이전 계정 데이터 노출 방지).
  - 임시 동작: 저장 실패 시 안내 문구 없이 별만 원복(토스트 인프라 부재).

## 4. ⚠️ 백엔드 갭 (2026-07-03 실시간 전환 후 재검증 — 대부분 해소)
해소됨: 목록 리뷰수(`reviewCount`) · 이름 검색(`q`) · `price_desc` · 카테고리 8종(한글 매칭 정상, 마사지 6,095건) · `slot_date`.
**2026-07-04 백엔드 배포(`cd10fec`~)로 추가 해소: 1(슬롯 500)·3(priceTier)·4(region)·5(위치 기반 조회)** — 아래 표는 이력 보존용, 남은 갭은 2·6뿐.

| # | 남은 항목 | 백엔드 현황 | FE 처리 |
|---|---|---|---|
| 1 | ~~**슬롯 API 2종 500 에러(버그)**~~ ✅해소 | ~~`date` 컬럼 조회~~ → `slot_date`로 수정 배포 | 상세 빈자리·시간 필터 실동작 재검증 완료(2026-07-04) |
| 2 | **세부 시술 필터** | 없음 | 보류(UI 유지) |
| 3 | ~~`priceTier` 타입 표기 불일치~~ ✅해소 | BE 타입 `'4만원이상'`으로 정정 | FE는 원래 실데이터 기준 |
| 4 | ~~`region` 항상 "서울" 하드코딩~~ ✅해소 | region null 반환으로 수정 | FE는 원래 region 미사용(`formatDistrict`) |
| 5 | ~~위치 기반 조회(lat/lng/radius) 없음~~ ✅해소 | `GET /shops?lat&lng&radius`(km, 기본 5) + `available_within_days=N` 신규 | ~~"내 주변" 기능 미구현~~ → **2026-07-05 현재위치 버튼 토글로 연동 완료**(§3 내 주변). `available_within_days`는 미사용(대응 UI 없음) |
| 6 | (선택) 목록 `isFavorite` / 주소 동(dong) / sameDay·available 구분 | 없음 | GET /favorites 대조 / 구까지 / 둘 다 has_slot |

## 5. 남은 작업
- **네이버 지도 마무리**: 코드 완료. **NCP 키 발급**(console.ncloud.com Maps) → `.env`/EAS env `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` → **EAS 재빌드**(네이버·애플 로그인과 함께) → 실기기 검증. 절차 [dev-build.md](./dev-build.md) C-3.
  - ✅ **구현 완료(2026-07-03 확인)** — NCP 키 발급·`.env`/EAS env 주입·dev build 실기기 검증까지 전부 끝남(상단 상태 줄과 동일). 더 이상 남은 작업 아님.
- ~~**슬롯 API 백엔드 수정(§4-1) 후**: 상세 빈자리·예약시간 필터 실동작 재검증(FE 코드는 완료).~~ → **2026-07-04 재검증 완료**(§6).
- ~~**"내 주변" 매장(§4-5 신규 `lat/lng/radius`) 연동** — 홈에서의 노출 방식(버튼/기본 동작) 기획·디자인 확정 후.~~ → **2026-07-05 완료**(현재위치 버튼 토글 — 사용자 확정). ~~모드 표시 UI는 디자인 확정 대기.~~ → **2026-07-10 완료**(내 위치 마커 + 버튼 활성 색 — §3 내 주변).
- 마커 클러스터링(핀 많아지면).

## 6. 검증
- `npm run typecheck`/`lint` 통과.
- web(`expo start --web`) + 로컬 BE(`docker compose up`): 목록·필터(districts/price_tiers/sort/has_event/has_slot)·검색·price_desc·빈상태/에러 확인. 지도는 placeholder 폴백. (categories는 백엔드 버그로 0건)
- **예약시간 필터(2026-07-04, 백엔드 슬롯 수정 배포 후)**: 오늘+11:00 선택 → `GET /slots/search?dates=&times=` 200 + 교집합 목록 표시 확인(FE 무수정).
- 즐겨찾기(로그인 세션 필요 — 웹은 `syak_access` 쿠키 주입): 별 탭 → 즉시 반영 + POST 201 → 새로고침 유지 → 재탭 DELETE 204. 홈에서 켠 샵 상세 진입 시 별 켜짐(단일 캐시). 연타 시 요청 1건. BE 중단 상태 탭 → 별 원복(롤백). 비회원 별 탭 → LoginPromptModal + GET /favorites 미발생.
- 지도(dev build + NCP 키): 네이버 지도 렌더·샵 핀(좌표 null 제외)·partner/discount/reservable 3색 핀·핀탭 상세이동·현재위치 권한→카메라 이동·서울 초기 카메라.
- **내 주변(2026-07-05, 웹 + geolocation 스텁 주입)**: 버튼 탭 → `GET /shops?lat&lng&page=1`(radius 미전송) + 목록이 강남 5km 매장만(강남·서초·송파 등) / 재탭 → lat/lng 없이 전체 복귀 / 할인·이벤트 필터와 조합 시 `has_event=true&lat&lng` 동시 전달 / 권한 거부 스텁 → 요청·목록 변화 없음. 실기기 GPS는 fast refresh로 확인 예정(재빌드 불필요).
- **내 위치 마커 + 버튼 활성 색(2026-07-10)**: 웹은 버튼 색만 검증 가능(지도 placeholder) — 버튼 탭 → 아이콘 #007AFF, 재탭 → 회색 원복. 마커는 실기기(dev build + Metro, `locationOverlay`는 JS prop이라 재빌드 불필요) — 버튼 탭 → 파란 마커 표시 + 카메라 이동, 재탭 → 마커 숨김.
