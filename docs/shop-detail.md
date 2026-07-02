# 샵 상세페이지 (shop-detail)

홈 지도뷰 매장 목록에서 카드를 탭하면 진입하는 매장 상세 화면.
**상태: 백엔드 연동 완료** — `GET /shops/:id`(상세) + `GET /slots/shop/:id`(빈자리 3일치). 단 메뉴·리뷰 목록·도로명주소·다중 사진은 **백엔드 미노출(§백엔드 갭)** → 빈 상태/축소 표시, 백엔드 노출 시 자동 반영 구조.

## 디자인 출처
- 캡처: `designs/상세페이지/샵 상세 (수정).png`
- Pencil: `designs/design.pen` 프레임 `PA3vj`("샵 상세 (수정)"). 모든 수치/색은 pen에서 확인한 디자인 원값 그대로 사용.

## 라우팅 / 진입
- 라우트: `app/shop/[id].tsx` → `useLocalSearchParams`로 `id` 추출 → `<ShopDetailScreen shopId={id} />`.
- 진입: 홈 `ShopBottomSheet`의 매장 카드 `onPress` → `router.push('/shop/<id>')`.
- 뒤로가기: 상세 헤더 좌측 화살표 → `router.back()`.

## 화면 구조
```
[고정] DetailHeader              뒤로가기(좌) + 즐겨찾기 별(우), SafeArea top
[ScrollView] (stickyHeaderIndices=[1], scroll-spy)
  index0  홈 영역               ShopTitleBlock(이름·분류·리뷰수 / 배지) + ImageCarousel
  index1  SectionTabs ← sticky  홈·빈자리·메뉴·가격·정보·리뷰
  index2  AvailabilitySection   빈자리 (날짜칩 + 오전/오후/저녁 슬롯)
  index3  MenuSection           메뉴·가격 (리더선)
  index4  InfoSection           주소·오늘 예약·전화
  index5  ReviewSection         리뷰 본문·키워드 태그·날짜
[고정] ReservationBar            전화로 예약 / 네이버 예약, SafeArea bottom
```

### 탭 스크롤스파이
- "홈"은 화면 최상단(offset 0). 빈자리/메뉴·가격/정보/리뷰는 각 섹션 `View`의 `onLayout.y`를 `offsets` ref에 수집.
- 탭 press → `scrollTo(offset - 탭바높이)` (홈은 0). 스크롤 시 `onScroll`에서 현재 위치로 활성 탭 자동 갱신.
- 탭바는 `stickyHeaderIndices={[1]}`로 상단 고정. 고정 시 흰 배경, 활성 탭 밑줄(`#d23e6a`)·핑크 텍스트(`#b32f58`).

## 데이터 흐름 (백엔드 연동)
```
useShop(shopId)        GET /shops/:id        — 상세(이름·카테고리·리뷰수·배지·사진·전화·bookingUrl)
useShopSlots(shopId)   GET /slots/shop/:id   — 빈자리 슬롯 (dates 생략 = 오늘부터 3일치, flat)
        ↓
toShopDetailView(shop, slots)   ★ 뷰모델 어댑터 (shopDetailToView.ts)
  - category = categories.join(', ') / badges = eventDesc+priceTier (홈과 동일 규칙)
  - availability = 오늘 기준 3일 고정 × 오전(<12)/오후(12~18)/저녁(≥18) 그룹핑, 빈 구간 '마감되었습니다'
  - info = 주소(region+district) · 오늘 예약(오늘 슬롯 유무) · 전화
  - menus/reviews = [] (백엔드 미노출 → 섹션 빈 상태 문구)
        ↓ 각 섹션 컴포넌트
예약바: 전화 tel: / 네이버 예약 = bookingUrl 열기(없으면 비활성) + POST /shops/:id/reservation-click(애널리틱스, fire-and-forget)
```

## 파일 구조
```
src/screens/shop-detail/
  ShopDetailScreen.tsx        조립 + useShop/useShopSlots + 로딩/에러 + 스크롤스파이/스티키
  shopDetailToView.ts         ★ 뷰모델 타입 + toShopDetailView 어댑터 (슬롯 3일 그룹핑)
  components/
    DetailHeader.tsx          뒤로가기 + 즐겨찾기 별 (로컬 토글 — API는 로그인 연동 후)
    ShopTitleBlock.tsx        이름·분류·리뷰수 + 배지
    Badge.tsx                 배지/태그 칩 (bg·color·fontSize props)
    ImageCarousel.tsx         실이미지(expo-image) 캐러셀, 없으면 placeholder
    SectionTabs.tsx           탭바 (TabKey, TABS export)
    AvailabilitySection.tsx   날짜칩 선택 + 시간대 슬롯
    MenuSection.tsx           메뉴명 … 리더선 … 가격 (빈 상태: '메뉴 정보를 준비 중이에요')
    InfoSection.tsx           라벨/값 행
    ReviewSection.tsx         리뷰 본문 + 태그 + 날짜 (빈 상태: '리뷰를 준비 중이에요')
    ReservationBar.tsx        전화로 예약(tel) / 네이버 예약(bookingUrl, 없으면 비활성)
src/shared/domain/reservation/
  reservation.types.ts        ShopSlot { shopId, date, startTime }
  reservation.api.ts          getShopSlots(id) · postReservationClick(id)
  reservation.queries.ts      useShopSlots(id)
```

## ⚠️ 백엔드 갭 (디자인엔 있는데 상세 API가 안 줌 — 원본 Supabase detail JSONB엔 전부 있음, 노출 요청)
| # | 디자인 요구 | 백엔드 현재 | 원본 위치 | FE 임시 처리 |
|---|---|---|---|---|
| 1 | 메뉴·가격 목록 | 없음 | `detail.menus` ({name, price, recommend}) | 빈 상태 문구 |
| 2 | 리뷰 본문 목록(본문·태그·날짜) | `reviewCount` 숫자만 (리뷰 API 미구현) | `detail.reviews` ({body, images…}) | 빈 상태 문구 |
| 3 | 도로명 주소("망우로6길 8 1층") | `district`(구까지) | `detail.roadAddress` | region+district 표시 |
| 4 | 사진 캐러셀 여러 장 | `photos` = 대표 1장 | `detail.images` (4장) | 1장 표시 |
| 5 | 슬롯 "1자리 남았어요" 잔여수 | 슬롯에 잔여수 없음 | 원본에도 없음 | 미표시 |
> 1~4는 백엔드가 상세 응답에 노출만 하면 FE 어댑터에 매핑 추가로 즉시 반영.

## 주요 디자인 값 (디자인 HEX 그대로)
- 배지 — 첫방문 특가: bg `#fff1f6` / text `#b32f58`, 2만원대: bg `#f1f1f1` / text `#7a7a7a` (13/SemiBold, r4).
- 탭 — 활성 text `#b32f58` + 밑줄 `#d23e6a`, 비활성 `#7d7d7d` (16/Medium).
- 빈자리 날짜칩 — 선택 bg `#d23e6a`/text 흰색, 미선택 bg `#f3f1f2`/text `#333` (15/Medium, r4).
- 시간칩 — r999, border `#e6e6e6`, text `#555` (14/Medium). "마감되었습니다" bg `#f3f1f2`/text `#999`. 잔여 안내 `#d23e6a`.
- 메뉴 리더선 `#e6e6e6`, 메뉴명 `#7e7e7e` / 가격 `#1a1a1a` (15/Medium).
- 리뷰 본문 `#5b5b5b` (14/Medium, lh1.5), 키워드 태그 bg `#f1f1f1`/text `#7a7a7a` (11/SemiBold), 날짜 `#5b5b5b`(12).
- 예약바 — 전화로 예약: 흰 배경 border `#e6e6e6`/text `#7d7d7d`. 네이버 예약: bg `#00de5a`/text 흰색 + ↗. (r8, 16/SemiBold)
- 폰트: 전부 Pretendard. SemiBold=`font-pretendard-semibold`, Medium=`font-pretendard-medium`, Regular=`font-pretendard`.

## 임시 동작 / 참고
- **'오늘 예약 가능해요' 문구**: 디자인엔 마감 상태 문구('오늘은 예약 마감이에요')만 있어 가능 상태는 대칭 문구로 채움 — 디자인 확정 시 교체.
- **네이버 예약 라벨**: `bookingUrl`이 네이버가 아닐 수도 있음(인스타 등) — 사용자 확정으로 라벨 유지 + URL 열기. 없으면 비활성.
- **헤더 즐겨찾기 별**: 로컬 토글(즐겨찾기 API는 로그인 연동 후 일괄).
- 예약 생성 API 없음 — 예약 확정은 외부 링크(`bookingUrl`) 정책(백엔드 docs 명시).

## 남은 작업
- **백엔드 갭(§위)** 노출 시: menus/reviews/roadAddress/images 어댑터 매핑 추가.
- 즐겨찾기 API 연동(로그인 후), 슬롯 탭 → 예약 플로우(정책 확정 후), iOS 빌드 확인.

## 검증
- `npm run typecheck` / `npm run lint` 통과.
- web + 로컬 BE(실매장 시드): `/shop/1042079600` — 실데이터 헤더(고담맨즈헤어·헤어·리뷰 34140·1만원대)·실사진·빈자리 3일 실슬롯 그룹핑(오전/오후/저녁)·정보(주소·오늘 예약·전화)·메뉴/리뷰 빈 상태 문구·스크롤스파이 확인 완료.
- 실기기: fast refresh(재빌드 불필요)로 전화 tel:·네이버 예약 URL 열기 확인.
