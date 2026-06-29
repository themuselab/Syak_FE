# 홈 (지도뷰)

> 상태: **Phase 1(UI) 완료** — 지도 외 모든 UI 구현·검증. 지도(네이버)는 Phase 2(dev build), 데이터는 mock(백엔드는 이후).
> 디자인: `designs/홈지도뷰/*`, `design.pen` 프레임 `GhhI1`(메인)·`aMGlg`(정렬)·`T7ZAb7`(지역)·`ykdR2`(가격)·`S5sgV5`(예약시간)·`Ib0Re`(시술)·`FvUT4`(빈 상태).

## 1. 구성
- **헤더**: 로고 + 알림/프로필 아이콘 (상단 핑크 그라데이션 위).
- **검색바**: pill, 핑크 테두리, mock 이름 검색(store.search).
- **지도**: Phase 1은 단색 placeholder(`MapPlaceholder`). Phase 2에서 `NaverMapView`로 교체(교체 지점 1곳).
- **현재위치 버튼**: 지도 우하단.
- **바텀시트**(`@gorhom/bottom-sheet`): 드래그(snap 45%↔90%), 상단 칩바(고정) + 매장 목록/빈 상태.
- **칩바**: 좌측 고정 정렬칩(`기본순`, divider) + 가로 스크롤 칩(당일예약·할인이벤트·예약가능 토글 / 지역·가격·예약시간·시술 모달). 선택 시 핑크.
- **매장 카드**: 썸네일 + 이름·리뷰·주소·배지(첫방문특가 핑크/가격대 회색)·즐겨찾기 별.
- **빈 상태**: "조건에 맞는 샵을 못찾았어요🥹" + 초기화.
- **필터**(정렬·가격·예약시간·시술·지역): **별도 모달이 아니라 같은 바텀시트 안에서 내용 전환**. 칩 탭 → 시트가 필터 화면(제목+divider+내용+닫기)으로 바뀌고 **칩바는 숨김**, 닫기 → 목록 복귀. 필터별 시트 높이(snap)·radius(20)는 design.pen 값. (헤더·검색·지도·현재위치는 유지)
  - 정렬/가격=단일(선택 시 자동 닫힘, 텍스트 `#c9516e`), 예약시간=날짜+시간 다중(칩 `#c24a6b`), 시술=분야+시술 다중, 지역=시도탭+구 그리드+선택칩 다중.

## 2. 파일 구조
```
app/home.tsx                         # 라우트 → HomeScreen
src/screens/home/
  HomeScreen.tsx                     # 조립 + 필터 모달 ref/present
  useHomeFilterStore.ts              # zustand 필터 상태
  mockShops.ts                       # Phase1 mock 매장
  components/
    MapPlaceholder · HomeHeader · SearchBar · CurrentLocationButton
    FilterChip · FilterChipBar · ShopBottomSheet · ShopListCard · ShopListEmpty
    filters/ FilterView(시트 내부 틀) · SelectChip · Sort/Price/Time/Service/RegionFilterContent
```
- 아이콘: lucide(UI) + 마커 핀 PNG(`assets/icons/pin-*.png`, Phase 2용, design.pen export).

## 3. 상태/로직 (Phase 1, mock)
- `useHomeFilterStore`: search/sort/regions/price/date/times/serviceFields/services/toggles + reset.
- 칩바 활성 표시·목록 필터링 구동. 검색어+가격으로 mock 필터링(0건 → 빈 상태).
- 즐겨찾기: HomeScreen 로컬 state로 토글.

## 4. 남은 작업
- **Phase 2(dev build, 네이버 지도)**: `app.json` 플러그인(client_id)+`expo-build-properties`, `MapPlaceholder`→`NaverMapView`(마커=`pin-*.png` 색별, 현재위치 `expo-location`). 갤럭시탭 dev build.
- **Phase 3(백엔드)**: `src/shared/domain/shops/`로 mock 교체, 검색·필터를 쿼리 파라미터로. (`../syakBE/docs/02-catalog.md`·`03-reservation.md`)
- 정밀 폴리시: 지역/시간 그리드 컬럼 수, 닫기 버튼 위치 등 기기에서 미세 조정.

## 5. 검증
- `tsc` 통과. web(`expo start --web`)에서 메인·지역·예약시간 모달을 디자인 캡처와 대조(일치). 지도는 placeholder.
