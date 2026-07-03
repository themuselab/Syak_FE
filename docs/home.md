# 홈 (지도뷰)

> 상태: **UI + 백엔드 샵 연동(실시간 Supabase 4만 매장) + 네이버 지도 실기기(dev build) 검증 완료.** 검색·정렬·카테고리 8종은 서버 필터, 예약시간은 `/slots/search` 교집합(단 슬롯 API는 백엔드 42703 버그로 수정 대기 — §4).
> 홈은 **비회원도 접근**(`/shops` 무인증). 디자인: `designs/홈지도뷰/*`, `design.pen` 프레임 `GhhI1`(메인)·`aMGlg`(정렬)·`T7ZAb7`(지역)·`ykdR2`(가격)·`S5sgV5`(예약시간)·`Ib0Re`(시술)·`FvUT4`(빈 상태).

## 1. 구성
- **헤더**: 로고 + 알림/프로필. 벨 → `/notifications`, 유저 → `/my`.
- **검색바**: pill, 핑크 테두리. 이름 검색(`store.search`) — **서버 `q` 파라미터**(ilike 부분검색). 타이핑마다 refetch하지 않도록 **300ms 디바운스**(`useDebouncedValue`).
- **지도**: `HomeMap`(네이버지도 `NaverMapView`) + 샵 좌표 핀. **핀 탭 → 바텀시트에 그 매장 미리보기(카드 1개, 시트 40%로)** → 카드 탭 또는 시트를 위로 크게 올리면(90%) `/shop/:id` 상세 진입. **지도 빈 곳 탭 → 미리보기 해제**(전체 목록 복귀). web/Expo Go/키 없음은 회색 placeholder(`HomeMap.web.tsx` + 키 가드).
- **현재위치 버튼**: 지도 우하단. `expo-location` 권한 → 좌표 → 지도 카메라 이동(`HomeMap` ref `moveTo`).
- **바텀시트**: 드래그(40%↔90%), 칩바(고정) + 매장 목록 / 미리보기(핀 선택 시 카드 1개) / 로딩 / 에러 / 빈 상태. 목록 하단·필터 닫기 버튼은 **safe area bottom inset 반영**(안드 내비 바에 안 가림).
- **매장 카드**: 썸네일(`photos[0]`) + 이름·**리뷰수(`리뷰 N`)**·주소·배지·즐겨찾기 별.
- **필터**: 같은 바텀시트 안에서 내용 전환(별도 모달 아님). 칩 탭 → 필터 화면, 닫기 → 목록.

## 2. 파일 구조
```
app/home.tsx                         # 라우트 → HomeScreen
src/screens/home/
  HomeScreen.tsx                     # 조립 + useShops(+useSlotSearch 교집합) + favorite 로컬
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

- **뷰모델 변환**(`shopToView.ts`): 주소=`formatDistrict(district)`(region은 백엔드 "서울" 고정 버그로 미사용 — 서울 구만 "서울 " 접두), badges=`eventDesc`+`priceTier`, markerKind=`isPartner→partner / eventDesc→event / else default`, favorite=로컬 `favoriteIds`.
- **즐겨찾기**: 1차 **로컬 토글**(HomeScreen `favoriteIds` Set). `/favorites`는 인증 필요 + 홈은 비회원 접근이라, 실연동은 로그인 dev build 이후. 비회원 별 탭 시 1차는 로컬만(추후 `비회원로그인 알림` 모달).

## 4. ⚠️ 백엔드 갭 (2026-07-03 실시간 전환 후 재검증 — 대부분 해소)
해소됨: 목록 리뷰수(`reviewCount`) · 이름 검색(`q`) · `price_desc` · 카테고리 8종(한글 매칭 정상, 마사지 6,095건) · `slot_date`.

| # | 남은 항목 | 백엔드 현황 | FE 처리 |
|---|---|---|---|
| 1 | **슬롯 API 2종 500 에러(버그)** | `GET /slots/shop/:id`·`GET /slots/search` 모두 `column slots.date does not exist`(42703) — 코드가 `date` 컬럼 조회, 실 Supabase는 `slot_date`. 운영 서버도 동일 | 상세 빈자리=빈 상태, 시간 필터=에러 상태(수정 시 자동 동작) |
| 2 | **세부 시술 필터** | 없음 | 보류(UI 유지) |
| 3 | `priceTier` 타입 표기 불일치 | BE 타입 `'4만원대+'` vs 실데이터 `'4만원이상'` | FE는 실데이터 기준 |
| 4 | `region` 항상 "서울" 하드코딩 | `PgShopRepository.ts:119` — 전국 데이터인데 고정 | region 미사용, `formatDistrict(district)` 표기(수정 요청함) |
| 5 | 위치 기반 조회(lat/lng/radius) 없음 | 파라미터 없음 — "내 주변"·지도 핀에 필요 | 요청함(데이터에 좌표는 있음) |
| 6 | (선택) 목록 `isFavorite` / 주소 동(dong) / sameDay·available 구분 | 없음 | 로컬 favorite / 구까지 / 둘 다 has_slot |

## 5. 남은 작업
- **네이버 지도 마무리**: 코드 완료. **NCP 키 발급**(console.ncloud.com Maps) → `.env`/EAS env `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` → **EAS 재빌드**(네이버·애플 로그인과 함께) → 실기기 검증. 절차 [dev-build.md](./dev-build.md) C-3.
- **슬롯 API 백엔드 수정(§4-1) 후**: 상세 빈자리·예약시간 필터 실동작 재검증(FE 코드는 완료).
- favorite API 연동(로그인 후), 마커 클러스터링(핀 많아지면).

## 6. 검증
- `npm run typecheck`/`lint` 통과.
- web(`expo start --web`) + 로컬 BE(`docker compose up`): 목록·필터(districts/price_tiers/sort/has_event/has_slot)·검색·price_desc·빈상태/에러 확인. 지도는 placeholder 폴백. (categories는 백엔드 버그로 0건)
- 지도(dev build + NCP 키): 네이버 지도 렌더·샵 핀(좌표 null 제외)·partner/discount/reservable 3색 핀·핀탭 상세이동·현재위치 권한→카메라 이동·서울 초기 카메라.
