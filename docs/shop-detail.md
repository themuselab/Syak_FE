# 샵 상세페이지 (shop-detail)

매장 상세 화면. **진입 경로 2개(2026-07-10 특정샵 포커스 반영)**: ① 홈에서 핀/카드 탭 → **바텀시트 인라인 상세**(`ShopDetailSheet`, 라우트 이동 없음 — [home.md](./home.md) §3 특정샵 포커스) ② 라우트 `/shop/:id`(알림 딥링크 등 홈 외 진입). 본문은 `ShopDetailBody`로 공유.
**상태: 백엔드 연동 완료(실시간 Supabase)** — `GET /shops/:id`(상세) + `GET /slots/shop/:id`(빈자리 3일치). 메뉴·리뷰·도로명주소·다중 사진 **실데이터 표시**. ~~단 빈자리는 **백엔드 슬롯 API 버그(42703)로 수정 대기**(§백엔드 갭).~~ → **2026-07-04 백엔드 수정 배포로 해소 — 빈자리 실데이터 재검증 완료(§검증).**

## 디자인 출처
- 캡처: `designs/상세페이지/샵 상세 (수정).png`
- Pencil: `designs/design.pen` 프레임 `PA3vj`("샵 상세 (수정)"). 모든 수치/색은 pen에서 확인한 디자인 원값 그대로 사용.

## 라우팅 / 진입
- **홈(주 경로, 2026-07-10~)**: 핀/카드 탭 → `ShopBottomSheet` 안 `ShopDetailSheet` 인라인 표시(35%↔100%, push 없음). 뒤로가기 = 시트 접힘(`onBack` 주입).
- **라우트**: `app/shop/[id].tsx` → `useLocalSearchParams`로 `id` 추출 → `<ShopDetailScreen shopId={id} />`. 알림 딥링크(`push.ts`) 등 홈 외 진입용으로 유지. 뒤로가기 = `router.back()`(기본값).
- 두 경로는 같은 쿼리키(`['shops',id]`/`['slots',id]`)를 공유 — 시트에서 본 샵은 라우트 진입 시 캐시 재사용.

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
- **공유 구조(2026-07-10)**: 위 로직은 `useSectionSpy` 훅 + `ShopDetailBody`(섹션 조립, `renderScroll` render prop으로 스크롤 컨테이너 주입)로 추출 — 라우트는 RN `ScrollView`, 홈 시트는 `BottomSheetScrollView`(시트 드래그 제스처 연동, `scrollEventThrottle`은 gorhom 내부 관리라 미전달). sticky는 children이 스크롤뷰 직계 배열이어야 동작(프래그먼트 래핑 금지).

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
  ShopDetailScreen.tsx        라우트 화면 조립 + useShop/useShopSlots + 로딩/에러 (본문은 Body 위임)
  ShopDetailSheet.tsx         홈 포커스 시트용 인라인 상세 — expanded 시 헤더·예약바 표시, onCollapse 주입
  ShopDetailBody.tsx          공유 본문(타이틀·캐러셀·sticky 탭·섹션 4개) — renderScroll로 컨테이너 주입
  useSectionSpy.ts            스크롤스파이 훅(activeTab·offsets·bottomPad·reset) — 구조적 scrollTo 타입
  shopDetailToView.ts         ★ 뷰모델 타입 + toShopDetailView 어댑터 (슬롯 3일 그룹핑)
  components/
    DetailHeader.tsx          뒤로가기(onBack 주입 가능, 기본 router.back) + 즐겨찾기 별
    ShopTitleBlock.tsx        이름·분류·리뷰수 + 배지 (+옵션 별 — 포커스 시트 35% 디자인)
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
| 1 | ~~**빈자리 슬롯 API 500(버그)**~~ ✅해소(2026-07-04) | ~~`date` 컬럼 조회~~ → `slot_date`로 수정 배포 | 빈자리 실데이터 자동 동작 — 재검증 완료(§검증) |
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
- **빈자리 시간 칩 톤(2026-07-14, QA #56)**: 버튼형(rounded-full+테두리 #e6e6e6)이 선택 가능해 보인다는 QA 지적 → 테두리 제거 + 배경 `#f3f1f2`(날짜 칩 비선택과 동일 계열) 정보성 톤으로 변경. **확정 스타일은 디자이너 확인 항목.**
- **'오늘 예약 가능해요' 문구**: 디자인엔 마감 상태 문구('오늘은 예약 마감이에요')만 있어 가능 상태는 대칭 문구로 채움 — 디자인 확정 시 교체.
- **예약 버튼 = 서버 라우트 기반 (2026-07-18 BE 개편 — QA #32 완결)**: ~~FE가 bookingUrl URL을 추측해 분기~~ → `GET /shops/:id`의 `bookingType` + `reservationRoutes[{type,label,value}]`(naver/talktalk/instagram/kakao/phone, 라벨 서버 제공) 사용. 대표 라우트 1개만 우측 버튼(2버튼 유지 — 사용자 확정): 라벨 = `route.label` 그대로("네이버로 예약"/"인스타로 문의"/"톡톡으로 문의"/"카카오로 문의"/"전화로 예약"), `type='phone'`은 `tel:` 변환. 라우트 없으면 비활성. URL 추측 함수(resolveBooking) 제거. **다수 라우트 동시 노출·종류별 버튼 색은 디자인 부재 — 디자이너 확인 항목**(현재 전 종류 네이버 그린).
- **별은 화면당 항상 1개(2026-07-25 QA #58)**: 라우트 `/shop/:id`는 원래 헤더 별 1개. 홈 포커스 시트는 접힘(35%)에서 헤더가 없어 타이틀 별을 쓰는데, 풀스크린으로 올리면 헤더 별과 **둘 다** 보였다 → `ShopDetailSheet`가 `expanded`일 때 `ShopDetailBody`에 `onToggleFavorite`을 넘기지 않아 타이틀 별을 끈다(`ShopTitleBlock`이 이미 `onToggleFavorite &&` 조건부 렌더라 컴포넌트 수정 없음). **접힘=타이틀 별 / 풀스크린=헤더 별.**
- **메뉴·정보 행 줄바꿈(2026-07-25 QA #57)**: `MenuSection` 가격은 `flexShrink: 0`+`numberOfLines={1}` 고정, 메뉴명이 `flexShrink: 1`로 양보(말줄임). 막지 않으면 `'75,000원'`의 `원`이 줄바꿈 기회로 잡혀 두 줄로 꺾인다. `InfoSection`은 반대로 라벨 고정·값(주소)이 흡수(`textAlign: right`). `ShopListCard`(QA #46)와 동일 패턴.
- **헤더 즐겨찾기 별**: `/favorites` 서버 연동 완료(2026-07-04) — 홈과 같은 `['favorites','list']` 캐시에서 파생(`useFavoriteShopIds`)이라 **홈↔상세 별 상태 자동 동기화**. 토글은 낙관적 업데이트(`useToggleFavorite`), 비회원 탭 시 `LoginPromptModal`(로딩/에러 화면 포함 모든 분기에서 동작). 저장 실패 시 안내 없이 별만 원복(토스트 인프라 부재). 상세는 [home.md](./home.md) §3 즐겨찾기.
- 예약 생성 API 없음 — 예약 확정은 외부 링크(`bookingUrl`) 정책(백엔드 docs 명시).

## 남은 작업
- ~~**슬롯 API 백엔드 수정 후** 빈자리 실데이터 재검증(FE 코드 완료).~~ → **2026-07-04 완료.** 리뷰 작성일은 백엔드 노출 시 매핑만 추가.
- 슬롯 탭 → 예약 플로우(정책 확정 후), iOS 빌드 확인.

## 검증
- `npm run typecheck` / `npm run lint` 통과.
- web + 로컬 BE(실매장 시드): `/shop/1042079600` — 실데이터 헤더(고담맨즈헤어·헤어·리뷰 34140·1만원대)·실사진·빈자리 3일 실슬롯 그룹핑(오전/오후/저녁)·정보(주소·오늘 예약·전화)·메뉴/리뷰 빈 상태 문구·스크롤스파이 확인 완료.
- 실기기: fast refresh(재빌드 불필요)로 전화 tel:·네이버 예약 URL 열기 확인.
- **빈자리 재검증(2026-07-04, 백엔드 슬롯 수정 배포 후)**: `/shop/1683892292` — `GET /slots/shop/:id` 200, 오늘/내일/모레 날짜 칩 전환 + 오전/오후/저녁 그룹핑 실슬롯 표시 확인(FE 무수정).
