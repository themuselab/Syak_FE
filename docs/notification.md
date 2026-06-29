# 알림 (알림 목록 · 비회원 로그인 유도 모달)

> 상태: **프론트 UI/UX 구현 완료**, 백엔드(React Query) 연동 대기.
> 디자인 원본: `designs/알림/알림.png`, `designs/비회원로그인 알림/비회원 로그인 알림.png`,
> `designs/design.pen` 프레임 `SXtVD`(알림), `B9m9C`(비회원 모달 — 카드 `KfxCM`, 딤 `JihSb`).

## 1. 범위
알림 목록 화면(`/notifications`)과, 비회원 로그인 유도 모달(재사용 컴포넌트). 이번 단계는 **UI/UX만** — 데이터는 목.

## 2. 화면 & 흐름
```
/notifications (알림)                      [src/screens/notification/NotificationScreen.tsx]
  ├ 헤더: 뒤로가기(←) + "알림" 타이틀
  ├ 목록 있음 → 알림 행 N개 (목 데이터 3건)
  └ 목록 없음 → "새로운 알림이 없습니다" 빈 상태
LoginPromptModal (비회원 로그인 유도, 재사용) [src/shared/ui/LoginPromptModal.tsx]
  ├ 딤 배경/X 탭 → onClose
  └ "로그인하러 가기" → (기본) router.push('/login')
       └ 트리거 미연결 — 추후 비회원이 알림 진입 시 게이팅으로 연결 예정
```

## 3. 라우팅
| 라우트 | 파일 | 화면 |
|---|---|---|
| `/notifications` | `app/notifications.tsx` | `NotificationScreen` |

- 라우트 파일은 얇게 — 화면 본체는 `src/screens/notification/`에서 렌더(기존 그대로).
- 화면 간 이동은 `router`(하단 탭바 없음, 루트 스택).

## 4. 파일 구조
```
src/screens/notification/
  NotificationScreen.tsx          # 헤더 + FlatList(목록) / 빈 상태 분기
  mockNotifications.ts            # NotificationItemData 타입 + MOCK_NOTIFICATIONS 3건
  components/
    NotificationHeader.tsx        # SafeArea + 뒤로가기(←) + "알림" 타이틀
    NotificationItem.tsx          # 썸네일 + 제목/본문 + 우측 시각, 하단 보더
    NotificationEmpty.tsx         # "새로운 알림이 없습니다" 중앙 정렬
src/shared/ui/
    LoginPromptModal.tsx          # 비회원 로그인 유도 모달(재사용)
```
> 알림 전용 부품은 페이지 폴더, 로그인 유도 모달은 여러 페이지에서 쓸 재사용 컴포넌트라 `src/shared/ui`.

## 5. 컴포넌트 명세
- **NotificationHeader** — SafeArea 상단 + 뒤로가기 행(`ArrowLeft` 24 / `#bfbfbf` / `router.back()`) + "알림"(20 SemiBold, letterSpacing -0.4).
- **NotificationItem** `{ item }` — 행 패딩 `py-4 px-5`, gap 12, 하단 1px `#f3f3f3`. 썸네일 40×40 `rounded-lg` `#e3e3e3`. 제목 16 Medium `#1a1a1a`, 본문 13 Medium `#7e7e7e`, 시각 11 Regular `#bfbfbf`.
- **NotificationEmpty** — 중앙 "새로운 알림이 없습니다" (`text-body-m` `gray-500`).
- **LoginPromptModal** `{ visible, onClose, onPressLogin? }` — RN `Modal`(transparent, fade). 딤 `#00000099`(탭 시 onClose). 카드: width 화면-40, `rounded-lg`, 그림자, 패딩 `[28,28,20,28]`, minHeight 222 `justify-between`. X(14, `#555555`). 타이틀 "로그인하고 / 샥- 이용해보세요!"(20 SemiBold, **"샥-"만 분홍 `#c24a6b`**). 버튼 "로그인하러 가기"(h-12, `rounded-sm`, bg `#c24a6b`, 보더 `#e8e8e8`, 흰 글자 16 SemiBold). 기본 onPressLogin = `router.push('/login')`.

## 6. 디자인 토큰 / 정확값
- 폰트 Pretendard(`font-pretendard{-medium|-semibold}`).
- 디자인 전용 hex는 토큰 스케일에 없어 .pen 실측값을 하드코딩(기존 DetailHeader/ShopListCard/SectionTabs 선례):
  `#1a1a1a`(제목), `#7e7e7e`(본문), `#bfbfbf`(시각/화살표), `#f3f3f3`(보더), `#e3e3e3`(썸네일),
  `#00000099`(딤), `#c24a6b`(브랜드 분홍/버튼, 토큰 primary.500 `#d23e6a`와 근사), `#e8e8e8`(버튼 보더), `#555555`(X).

## 7. 에셋
- **추가 없음.** 썸네일은 회색 플레이스홀더, 아이콘은 `lucide-react-native`(`ArrowLeft`, `X`).

## 8. 임시 동작 (UI 우선)
- 알림 목록은 `MOCK_NOTIFICATIONS` 3건. 문구는 `designs/알림/알림.png` 캡처 그대로의 임시값.
- 알림 행 탭 비활성(구조만). 모달은 트리거 미연결.

## 9. 남은 작업 (백엔드 연동 단계)
- `src/shared/domain/notification`: `GET /api/v1/notifications` 요청함수 + React Query 훅 + 타입.
- BE 응답(`shopName`,`type`,`slotTime`,`slotDate`,`readAt`)으로 아이템 문구 동적 생성
  (`type==='favorite'`/`'near'` 분기, `readAt===null` 미읽음 뱃지). 현재 목 문구와 다름 — 연동 시 정리.
- 아이템 탭 → `shopId`로 `/shop/:id` 이동.
- 비회원이 알림 진입 시 `LoginPromptModal` 게이팅 연결(알림 API는 전부 인증 필요).
- 참고: `../syakBE/docs/05-notification.md`.

## 10. 검증
- `npm run typecheck`(tsc --noEmit), `npm run lint`.
- `npm run start` → `/notifications` 진입, 알림 3건 + 헤더가 `designs/알림/알림.png`와 일치하는지 대조.
- 빈 상태: `MOCK_NOTIFICATIONS`를 임시 `[]`로 두고 "새로운 알림이 없습니다" 확인.
- 모달: 임시로 `<LoginPromptModal visible onClose={()=>{}} />` 렌더해 `designs/비회원로그인 알림/*.png`와 대조(딤·카드·분홍 "샥-"·버튼). 확인 후 임시 렌더 제거.
