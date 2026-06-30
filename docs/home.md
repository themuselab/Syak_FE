# 홈 (지도뷰)

> 상태: **UI + 백엔드 샵 연동 + 네이버 지도 코드 완료.** 지도 실렌더는 NCP 키 + dev build 필요(키 없으면 placeholder 폴백).
> 홈은 **비회원도 접근**(`/shops` 무인증). 디자인: `designs/홈지도뷰/*`, `design.pen` 프레임 `GhhI1`(메인)·`aMGlg`(정렬)·`T7ZAb7`(지역)·`ykdR2`(가격)·`S5sgV5`(예약시간)·`Ib0Re`(시술)·`FvUT4`(빈 상태).

## 1. 구성
- **헤더**: 로고 + 알림/프로필. 벨 → `/notifications`, 유저 → `/my`.
- **검색바**: pill, 핑크 테두리. 이름 검색(`store.search`) — **백엔드 검색 파라미터가 없어 받은 목록 내 클라 필터**.
- **지도**: `HomeMap`(네이버지도 `NaverMapView`) + 샵 좌표 핀. **핀 탭 → `/shop/:id`**. web/Expo Go/키 없음은 회색 placeholder(`HomeMap.web.tsx` + 키 가드).
- **현재위치 버튼**: 지도 우하단. `expo-location` 권한 → 좌표 → 지도 카메라 이동(`HomeMap` ref `moveTo`).
- **바텀시트**: 드래그(40%↔90%), 칩바(고정) + 매장 목록 / 로딩 / 에러 / 빈 상태.
- **매장 카드**: 썸네일(`photos[0]`) + 이름·리뷰·주소·배지·즐겨찾기 별. **리뷰수는 목록 응답 미제공 → 값 있을 때만 표시(현재 숨김)**.
- **필터**: 같은 바텀시트 안에서 내용 전환(별도 모달 아님). 칩 탭 → 필터 화면, 닫기 → 목록.

## 2. 파일 구조
```
app/home.tsx                         # 라우트 → HomeScreen
src/screens/home/
  HomeScreen.tsx                     # 조립 + useShops + 클라 후처리 + favorite 로컬
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
- **목록**: `useShops(params)` — `params`는 `filtersToParams(store)`. 1차 `limit:100` 단일 조회(bounds 미지원·서울 단일 → 무한스크롤 추후).
- **필터 store → 백엔드 파라미터 매핑** (`filtersToParams.ts`):

| store | → GET /shops |
|---|---|
| `sort` price_asc/partner | `sort` (default·price_desc는 안 보냄) |
| `regions[]` | `districts` |
| `price` '1'/'2'/'3' | `price_tiers=['N만원대']` |
| `toggles.discount` | `has_event=true` |
| `toggles.sameDay` \|\| `toggles.available` | `has_slot=true` (백엔드에 둘 구분 없음) |
| `serviceFields` ∩ {헤어·네일·왁싱·반영구} | `categories` |
| `search` | 클라 필터(`name.includes`) |
| `sort==price_desc` | 클라 정렬(minPrice desc) |
| `date`/`times`/세부 `services`/시술분야 4종 외 | **보류**(쿼리 제외, 백엔드 미지원) |

- **뷰모델 변환**(`shopToView.ts`): 주소=`region+district`, badges=`eventDesc`+`priceTier`, markerKind=`isPartner→partner / eventDesc→event / else default`, favorite=로컬 `favoriteIds`.
- **즐겨찾기**: 1차 **로컬 토글**(HomeScreen `favoriteIds` Set). `/favorites`는 인증 필요 + 홈은 비회원 접근이라, 실연동은 로그인 dev build 이후. 비회원 별 탭 시 1차는 로컬만(추후 `비회원로그인 알림` 모달).

## 4. ⚠️ 백엔드 갭 (디자인엔 있는데 백엔드엔 없음/미동작 — 백엔드 팀 요청)
| # | 항목 | 백엔드 현황 | FE 임시 처리 |
|---|---|---|---|
| 1 | **`categories` 필터 매칭 0건(버그)** | 응답은 영문(`nail`), `nail`/`네일` 모두 0건. 문서는 한글 | 한글로 전송(plan대로). 고쳐지면 자동 동작 |
| 2 | 목록 카드 **리뷰수** | 목록에 `reviewCount` 없음(상세만) | 카드에서 숨김 |
| 3 | **이름 검색** | 검색 파라미터 없음 | 받은 목록 내 클라 필터 |
| 4 | **price_desc 정렬** | `sort`에 price_asc만 | 클라 정렬 |
| 5 | **시술분야 8종** | `categories` 4종만 | 4종만 전송, 나머지 보류 |
| 6 | **세부 시술 필터** | 없음 | 보류(UI 유지) |
| 7 | **예약시간(날짜+시간)** | `has_slot`(오늘 유무)만 | 보류(UI 유지) |
| 8 | (선택) 목록 `isFavorite` / 주소 동(dong) | 없음 | 로컬 favorite / 구까지만 |

## 5. 남은 작업
- **네이버 지도 마무리**: 코드 완료. **NCP 키 발급**(console.ncloud.com Maps) → `.env`/EAS env `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` → **EAS 재빌드**(네이버·애플 로그인과 함께) → 실기기 검증. 절차 [dev-build.md](./dev-build.md) C-3.
- **백엔드 갭(§4)** 반영 시 FE 연결(리뷰수·검색·categories·price_desc·시술/예약시간 필터).
- 무한스크롤(`total>limit`), favorite API 연동(로그인 후), 마커 클러스터링(핀 많아지면).

## 6. 검증
- `npm run typecheck`/`lint` 통과.
- web(`expo start --web`) + 로컬 BE(`docker compose up`): 목록·필터(districts/price_tiers/sort/has_event/has_slot)·검색·price_desc·빈상태/에러 확인. 지도는 placeholder 폴백. (categories는 백엔드 버그로 0건)
- 지도(dev build + NCP 키): 네이버 지도 렌더·샵 핀(좌표 null 제외)·partner/discount/reservable 3색 핀·핀탭 상세이동·현재위치 권한→카메라 이동·서울 초기 카메라.
