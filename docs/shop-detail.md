# 샵 상세페이지 (shop-detail)

홈 지도뷰 매장 목록에서 카드를 탭하면 진입하는 매장 상세 화면. **Phase 1: UI/UX + mock 데이터** (백엔드는 Phase 3).

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

## 파일 구조
```
src/screens/shop-detail/
  ShopDetailScreen.tsx        조립 + 스크롤스파이/스티키 로직
  mockShopDetail.ts           ShopDetail 타입 + MOCK_SHOP_DETAIL + getShopDetail(id)
  components/
    DetailHeader.tsx          뒤로가기 + 즐겨찾기 별
    ShopTitleBlock.tsx        이름·분류·리뷰수 + 배지
    Badge.tsx                 배지/태그 칩 (bg·color·fontSize props)
    ImageCarousel.tsx         가로 스크롤 placeholder 이미지
    SectionTabs.tsx           탭바 (TabKey, TABS export)
    AvailabilitySection.tsx   날짜칩 선택 + 시간대 슬롯
    MenuSection.tsx           메뉴명 … 리더선 … 가격
    InfoSection.tsx           라벨/값 행
    ReviewSection.tsx         리뷰 본문 + 키워드 태그 + 날짜
    ReservationBar.tsx        전화로 예약(tel) / 네이버 예약
```
수정: `src/screens/home/components/ShopBottomSheet.tsx` — 매장 카드 `onPress`로 상세 이동 연결.

## 주요 디자인 값 (디자인 HEX 그대로)
- 배지 — 첫방문 특가: bg `#fff1f6` / text `#b32f58`, 2만원대: bg `#f1f1f1` / text `#7a7a7a` (13/SemiBold, r4).
- 탭 — 활성 text `#b32f58` + 밑줄 `#d23e6a`, 비활성 `#7d7d7d` (16/Medium).
- 빈자리 날짜칩 — 선택 bg `#d23e6a`/text 흰색, 미선택 bg `#f3f1f2`/text `#333` (15/Medium, r4).
- 시간칩 — r999, border `#e6e6e6`, text `#555` (14/Medium). "마감되었습니다" bg `#f3f1f2`/text `#999`. 잔여 안내 `#d23e6a`.
- 메뉴 리더선 `#e6e6e6`, 메뉴명 `#7e7e7e` / 가격 `#1a1a1a` (15/Medium).
- 리뷰 본문 `#5b5b5b` (14/Medium, lh1.5), 키워드 태그 bg `#f1f1f1`/text `#7a7a7a` (11/SemiBold), 날짜 `#5b5b5b`(12).
- 예약바 — 전화로 예약: 흰 배경 border `#e6e6e6`/text `#7d7d7d`. 네이버 예약: bg `#00de5a`/text 흰색 + ↗. (r8, 16/SemiBold)
- 폰트: 전부 Pretendard. SemiBold=`font-pretendard-semibold`, Medium=`font-pretendard-medium`, Regular=`font-pretendard`.

## 임시 동작 / Phase 1 한계
- **데이터**: `getShopDetail(id)`는 id 무관하게 단일 mock 반환. Phase 3에서 `shops` 도메인 API로 교체하고 `ShopDetail` 타입을 `src/shared/domain/shops`로 이동.
- **이미지**: 회색 placeholder(126×152). 실제 이미지 없음.
- **빈자리**: 날짜칩 전환은 mock 데이터 기반(오늘은 디자인과 1:1, 내일/모레는 임시 슬롯). 슬롯 탭 예약 플로우 미구현.
- **예약 버튼**: 전화로 예약 → `Linking` `tel:` 연결. 네이버 예약 → 예약 URL 미정이라 동작 없음(추후 연결).
- **헤더 즐겨찾기 별**: pen 헤더엔 없으나 캡처 기준으로 추가(사용자 확정). 토글은 로컬 상태(백엔드 즐겨찾기 연동 대기).

## 남은 작업
- 백엔드 연동: 샵 상세 조회 / 빈자리 슬롯 / 즐겨찾기 / 리뷰 페이지네이션.
- 네이버 예약 링크 연결, 슬롯 선택 → 예약 플로우.
- 실제 이미지 캐러셀, iOS 빌드 확인.

## 검증
- `npx tsc --noEmit` 통과.
- `npx expo start --web` → 홈 목록 카드 탭 또는 `/shop/1` 직접 진입 → 디자인 캡처와 1:1 대조. 탭 스크롤스파이·날짜칩 전환·별 토글·전화 버튼 확인.
