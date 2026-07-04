# 샵 상세페이지 (shop-detail)

홈 지도뷰 매장 목록에서 카드를 탭하면 진입하는 매장 상세 화면.
**상태: 백엔드 연동 완료(실시간 Supabase)** — `GET /shops/:id`(상세) + `GET /slots/shop/:id`(빈자리 3일치). 메뉴·리뷰·도로명주소·다중 사진 **실데이터 표시**. 단 빈자리는 **백엔드 슬롯 API 버그(42703)로 수정 대기**(§백엔드 갭).

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
useShop(shopId)        GET /shops/:id        — 상세(이름·카테고리·리뷰수·배지·사진(갤러리 전체)·전화·bookingUrl
                                               ·roadAddress·menus·reviews)
useShopSlots(shopId)   GET /slots/shop/:id   — 빈자리 슬롯 (dates 생략 = 오늘부터 3일치, flat)
        ↓
toShopDetailView(shop, slots)   ★ 뷰모델 어댑터 (shopDetailToView.ts)
  - category = categories.join(', ') / badges = eventDesc+priceTier (홈과 동일 규칙)
  - availability = 오늘 기준 3일 고정 × 오전(<12)/오후(12~18)/저녁(≥18) 그룹핑, 빈 구간 '마감되었습니다'
  - info = 주소(roadAddress — 시/구 포함 전체 주소, 없으면 region+district 폴백) · 오늘 예약 · 전화
  - menus = {name, price: '75,000원' 포맷(null이면 빈값)} — recommend는 디자인에 없어 미사용
  - reviews = {text: body, tags: keywords} — 작성일 없음(백엔드 갭 → 미표시), images/ownerReply 미사용
        ↓ 각 섹션 컴포넌트
예약바: 전화 tel: / 네이버 예약 = bookingUrl 열기(없으면 비활성) + POST /shops/:id/reservation-click(애널리틱스, fire-and-forget)
```

## 파일 구조
```
src/screens/shop-detail/
  ShopDetailScreen.tsx        조립 + useShop/useShopSlots + 로딩/에러 + 스크롤스파이/스티키
  shopDetailToView.ts         ★ 뷰모델 타입 + toShopDetailView 어댑터 (슬롯 3일 그룹핑)
  components/
    DetailHeader.tsx          뒤로가기 + 즐겨찾기 별 (/favorites 서버 연동 — 홈과 단일 캐시)
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

## ⚠️ 백엔드 갭 (2026-07-03 실시간 전환 후 재검증)
해소됨(실데이터 표시 중): 메뉴·가격 목록 · 리뷰 본문(본문·키워드) · 도로명 주소 · 사진 여러 장.

| # | 남은 항목 | 백엔드 현황 | FE 처리 |
|---|---|---|---|
| 1 | **빈자리 슬롯 API 500(버그)** | `GET /slots/shop/:id` → `column slots.date does not exist`(42703). 코드가 `date` 컬럼 조회, 실 Supabase는 `slot_date`. 운영 서버 동일 | 빈자리 전 구간 '마감되었습니다'(슬롯 빈 배열) — 수정 시 자동 동작 |
| 2 | 리뷰 **작성일**(디자인 "5.31.일") | `reviews`에 날짜 필드 없음 | 날짜 미표시(`ReviewItem.date` optional) |
| 3 | 슬롯 "1자리 남았어요" 잔여수 | 슬롯에 잔여수 없음(원본에도 없음) | 미표시 |

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
- **헤더 즐겨찾기 별**: `/favorites` 서버 연동 완료(2026-07-04) — 홈과 같은 `['favorites','list']` 캐시에서 파생(`useFavoriteShopIds`)이라 **홈↔상세 별 상태 자동 동기화**. 토글은 낙관적 업데이트(`useToggleFavorite`), 비회원 탭 시 `LoginPromptModal`(로딩/에러 화면 포함 모든 분기에서 동작). 저장 실패 시 안내 없이 별만 원복(토스트 인프라 부재). 상세는 [home.md](./home.md) §3 즐겨찾기.
- 예약 생성 API 없음 — 예약 확정은 외부 링크(`bookingUrl`) 정책(백엔드 docs 명시).

## 남은 작업
- **슬롯 API 백엔드 수정 후** 빈자리 실데이터 재검증(FE 코드 완료). 리뷰 작성일은 백엔드 노출 시 매핑만 추가.
- 슬롯 탭 → 예약 플로우(정책 확정 후), iOS 빌드 확인.

## 검증
- `npm run typecheck` / `npm run lint` 통과.
- web + 로컬 BE(실매장 시드): `/shop/1042079600` — 실데이터 헤더(고담맨즈헤어·헤어·리뷰 34140·1만원대)·실사진·빈자리 3일 실슬롯 그룹핑(오전/오후/저녁)·정보(주소·오늘 예약·전화)·메뉴/리뷰 빈 상태 문구·스크롤스파이 확인 완료.
- 실기기: fast refresh(재빌드 불필요)로 전화 tel:·네이버 예약 URL 열기 확인.
