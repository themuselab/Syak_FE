# 즐겨찾기 목록 (favorite)

> 상태: **구현 완료(2026-07-10, 피드백 반영)** — `GET /favorites` + shopId별 `GET /shops/:id` 병렬 조회. 마이페이지 '즐겨찾기' 메뉴에서 진입.
> 디자인: `designs/피드백반영 디자인/즐겨찾기.png`·`즐겨찾기-샵 없을때.png`, `design.pen` 프레임 `lCEKa`(목록)·`nBj0c`(빈 상태).

## 1. 범위 / 화면 흐름
- 마이페이지 '즐겨찾기' 메뉴 탭 → `/favorites` push → 즐겨찾기 매장 목록.
- 카드 탭 → `/shop/:id`(라우트 상세) push. 별 탭 → 즐겨찾기 토글.
- **별 해제 UX(사용자 확정)**: 별을 꺼도 카드는 목록에 남고 별만 회색 전환 — 재탭으로 즉시 복구 가능. 화면을 나갔다 재진입하면 해제분이 목록에서 빠진다(진입 시점 스냅샷 방식 — §3).
- 비회원: 진입 시 `LoginPromptModal` 게이팅(알림 화면과 동일 — 닫기 back, 로그인 replace).
- 빈 상태 2종: ① 즐겨찾기 전체 없음 → "즐겨찾는 샵이 없어요🥺" + **메인으로 이동** 버튼(`router.navigate('/home')`) ② 카테고리 필터 결과 없음 → 문구만(칩 유지, 버튼 없음 — 디자인 부재로 사용자 확정).

## 2. 라우팅 / 파일 구조
```
app/favorites.tsx                       # 라우트 → FavoriteScreen (얇은 래퍼)
src/screens/favorite/
  FavoriteScreen.tsx                    # 조립 + 스냅샷 + useQueries 상세 병렬 + 필터
  components/
    CategoryChips.tsx                   # '전체'+8종 칩 가로 스크롤 (60px 고정폭, r999)
    FavoriteEmpty.tsx                   # 빈 상태 (showHomeButton으로 전체/필터 빈 구분)
src/shared/ui/ShopListCard.tsx          # ★ 홈에서 이동(2곳 사용 규칙) — ShopCardInfo 구조적 타입
src/shared/domain/favorite/favorite.queries.ts  # useFavorites(enabled) 신규 (원형 목록)
```
- `ShopListCard`는 홈 목록과 공용 — props를 카드가 실제 쓰는 필드만의 구조적 타입(`ShopCardInfo`)으로 바꿔 홈 `ShopCardView`(지도 필드 포함)와 즐겨찾기 파생 카드가 모두 만족.

## 3. 데이터 흐름
```
useFavorites(isLoggedIn)    GET /favorites — {shopId, shopName(스냅샷), shopRegion, createdAt}[]
        ↓ 첫 도착 시 화면 state로 1회 고정(snapshot) — 별 해제해도 카드 유지용
useQueries: snapshot.map → GET /shops/:shopId  (queryKey ['shops',id] = 상세 화면과 캐시 공유)
        ↓ detailToCard(detail, favoriteIds.has(id))  — 배지 규칙은 홈 toShopCardView와 동일
ShopListCard[]  (미도착/실패 샵은 폴백 카드: shopName + shopRegion, 썸네일 placeholder)
```
- 별 상태는 스냅샷이 아닌 **라이브 캐시**(`useFavoriteShopIds`) — `useToggleFavorite`의 낙관 반영이 즉시 별에 표시.
- **카테고리 필터**: '전체' 기본. 선택 시 `detail.categories.includes(선택값)`인 샵만 — 상세 미도착 샵은 '전체'에서만 노출.
- 페이지네이션 없음(BE 스펙 — 개인당 수십 개 수준 전제).

## 4. ⚠️ 백엔드 갭 / 전달사항
| # | 항목 | 현황 | FE 처리 |
|---|---|---|---|
| 1 | **favorites 응답에 샵 요약 없음**(사진·주소·배지·리뷰수·카테고리) | Supabase(샵)/RDS(유저) DB 분리로 JOIN 불가 — 이름·지역 스냅샷만 | shopId별 `GET /shops/:id` N+1 병렬 조회. **개선 요청(전달사항): favorites 응답에 샵 요약(사진 1장·district·카테고리·리뷰수·배지 원천) 포함 시 N+1 제거 가능** |
| 2 | 주소 동(dong) 미제공 | 디자인은 "서울 강동구 천호동", API는 구까지 | 홈과 동일하게 `formatDistrict(district)` — 구까지 표시(기존 갭, home.md §4-6와 동일) |
| 3 | shopName 스냅샷 | 샵 이름 변경 시 미갱신 | 상세 도착 시 상세 이름으로 대체(폴백 카드에서만 스냅샷 노출) |

## 5. 주요 디자인 값
- 칩: 60px 고정폭, r999, padding 세로 8, gap 5, 활성 stroke `#c24a6b`+text `#1a1a1a` / 비활성 stroke `#e6e6e6`+text `#555`, 14 Medium. 가로 스크롤(px 20).
- 카드: 홈 `ShopListCard`와 동일(60px 썸네일 r6, 이름 heading-m semibold, 리뷰 `#adb5bd`, 주소 body-m gray-600, 배지, 별 `#FFC107`).
- 빈 상태: 문구 13 Medium `#3f3f3f` 중앙, 버튼 335×48 r8(`rounded-sm`) `bg-primary-500` 16 semibold 흰색, 문구·버튼 gap 40.

## 6. 임시 동작
- 상세 조회 실패(폐업 등) 샵: 폴백 카드로 표시되고 탭 시 상세 화면에서 에러 처리 — 별도 제거 안 함.
- 즐겨찾기 자체 로딩/에러 상태는 디자인 부재 — 알림 화면 패턴 준용(스피너 / "불러오지 못했어요"+다시 시도).

## 7. 검증
- `npm run typecheck` / `npm run lint` 통과.
- 웹 비회원: `/my` → 즐겨찾기 탭 → LoginPromptModal(닫기 back).
- 웹 로그인 세션(로컬 도커 BE + `syak_access` 쿠키 주입): 목록 카드(상세 파생 사진·리뷰·배지)·별 해제 시 카드 유지+DELETE·재탭 재등록·재진입 시 제거 반영·카테고리 필터·빈 상태 2종·메인으로 이동.
- 실기기: 마이 → 즐겨찾기 → 칩 가로 스크롤·별 토글(재빌드 불필요).
