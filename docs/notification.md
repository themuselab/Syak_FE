# 알림 (알림 목록 · 비회원 로그인 유도 모달)

> 상태: **백엔드 연동 완료(FCM 푸시 제외)** — GET /notifications 목록·미읽음 뱃지·탭→상세·비회원 게이팅 동작.
> 단 **백엔드 FCM이 죽어 있어 실데이터가 안 쌓임**(§9) — 실사용자는 당분간 빈 상태를 보고, 백엔드 수정 시 FE 무수정으로 자동 동작.
> 디자인 원본: `designs/알림/알림.png`, `designs/비회원로그인 알림/비회원 로그인 알림.png`,
> `designs/design.pen` 프레임 `SXtVD`(알림), `B9m9C`(비회원 모달 — 카드 `KfxCM`, 딤 `JihSb`).

## 1. 범위
알림 목록 화면(`/notifications`) 백엔드 연동 + 비회원 로그인 유도 게이팅. FCM 푸시 수신은 다음 단계(§9).

## 2. 화면 & 흐름
```
/notifications (알림)                      [src/screens/notification/NotificationScreen.tsx]
  ├ 헤더: 뒤로가기(←) + "알림" 타이틀
  ├ 비회원 → LoginPromptModal (쿼리 enabled:false — 401 요청 자체가 안 나감)
  │    ├ 딤/X 탭 → canGoBack ? back() : replace('/home') (히스토리 없는 직접 진입 시 back이 no-op이라 홈 대체)
  │    └ "로그인하러 가기" → replace('/login') — push면 이 화면(모달 포함)이 스택에 남아 로그인 화면을 계속 덮음
  └ 회원 → useNotifications (GET /notifications, 오늘 생성분만)
       ├ 로딩 → 중앙 스피너 (디자인 미제공, 임시)
       ├ 에러 → 안내 + "다시 시도"(refetch) (디자인 미제공, 임시)
       ├ 빈 목록 → "새로운 알림이 없습니다"
       └ 목록 → 행 탭 시 router.push(`/shop/${shopId}`)
```
- 문구: 제목 `{shopName} {slotTime} 빈자리 알림!` + 고정 본문(캡처 그대로, **타입별 구분 없음 — 사용자 확정**).
- 미읽음: `readAt === null`이면 제목 좌측 6px 핑크 도트(`primary.500`) — **디자인 미제공 임시안(사용자 확정)**, 읽음 처리는 BE API 미구현이라 표시만.
- 시각: `createdAt` → `formatRelativeTime`(`src/shared/lib/date.ts`) '방금 전'/'N분전'/'N시간전'.

## 3. 라우팅
| 라우트 | 파일 | 화면 |
|---|---|---|
| `/notifications` | `app/notifications.tsx` | `NotificationScreen` |

- 라우트 파일은 얇게 — 화면 본체는 `src/screens/notification/`에서 렌더(기존 그대로).
- 화면 간 이동은 `router`(하단 탭바 없음, 루트 스택).

## 4. 파일 구조
```
src/screens/notification/
  NotificationScreen.tsx          # 게이팅 + 로딩/에러/빈/목록 분기 (mockNotifications는 연동하며 삭제)
  components/
    NotificationItem.tsx          # Pressable 행: 미읽음 도트 + 제목/본문 + 상대시각, 탭 → /shop/:id
    NotificationEmpty.tsx         # "새로운 알림이 없습니다" 중앙 정렬
src/shared/domain/notification/
  notification.types.ts           # NotificationItem/NotificationSettings(+Patch) — BE 05-notification.md 기준
  notification.api.ts             # getNotifications, getNotificationSettings, updateNotificationSettings
  notification.queries.ts         # useNotifications(enabled)·useNotificationSettings(enabled)·useUpdateNotificationSettings
src/shared/ui/
    LoginPromptModal.tsx          # 비회원 로그인 유도 모달(재사용) — 알림 게이팅에 최초 연결
```
- 설정 PATCH 캐시 전략: 응답이 전체 설정 객체라 invalidate 대신 **setQueryData로 캐시 직접 교체**(추가 GET 없음, 롤백 코드 불필요 — 코드베이스 첫 mutation+캐시 갱신 사례).
> 알림 전용 부품은 페이지 폴더, 로그인 유도 모달은 여러 페이지에서 쓸 재사용 컴포넌트라 `src/shared/ui`.

## 5. 컴포넌트 명세
- 헤더는 공용 **BackHeader**(`src/shared/ui/BackHeader.tsx`) 사용 — 마이페이지와 공유.
- **NotificationItem** `{ item, onPress }` — Pressable 행 패딩 `py-4 px-5`, gap 12, 하단 1px `#f3f3f3`. 썸네일 40×40 `rounded-lg` `#e3e3e3`. 미읽음 도트 6px `primary.500`(readAt===null일 때만, 제목 좌측). 제목 16 Medium `#1a1a1a`, 본문 13 Medium `#7e7e7e`, 시각 11 Regular `#bfbfbf`.
- **NotificationEmpty** — 중앙 "새로운 알림이 없습니다" (`text-body-m` `gray-500`).
- **LoginPromptModal** `{ visible, onClose, onPressLogin? }` — RN `Modal`(transparent, fade). 딤 `#00000099`(탭 시 onClose). 카드: width 화면-40, `rounded-lg`, 그림자, 패딩 `[28,28,20,28]`, minHeight 222 `justify-between`. X(14, `#555555`). 타이틀 "로그인하고 / 샥- 이용해보세요!"(20 SemiBold, **"샥-"만 분홍 `#c24a6b`**). 버튼 "로그인하러 가기"(h-12, `rounded-sm`, bg `#c24a6b`, 보더 `#e8e8e8`, 흰 글자 16 SemiBold). 기본 onPressLogin = `router.push('/login')`.

## 6. 디자인 토큰 / 정확값
- 폰트 Pretendard(`font-pretendard{-medium|-semibold}`).
- 디자인 전용 hex는 토큰 스케일에 없어 .pen 실측값을 하드코딩(기존 DetailHeader/ShopListCard/SectionTabs 선례):
  `#1a1a1a`(제목), `#7e7e7e`(본문), `#bfbfbf`(시각/화살표), `#f3f3f3`(보더), `#e3e3e3`(썸네일),
  `#00000099`(딤), `#c24a6b`(브랜드 분홍/버튼, 토큰 primary.500 `#d23e6a`와 근사), `#e8e8e8`(버튼 보더), `#555555`(X).

## 7. 에셋
- **추가 없음.** 썸네일은 회색 플레이스홀더, 아이콘은 `lucide-react-native`(`ArrowLeft`, `X`).

## 8. 임시 동작 (남은 것만)
- 로딩/에러 상태 UI는 디자인 미제공 — 스피너/문구+재시도로 임시 처리(코드 주석 명시).
- 미읽음 도트는 디자인 미제공 임시안(6px 핑크) — 디자이너 확인 후 조정.
- 읽음 처리 없음(BE API 미노출) — 뱃지 표시만.

## 9. ⚠️ 백엔드 현황 (2026-07-03 코드 조사 — syakBE는 우리가 수정 안 함)

**동작하는 것**: `GET /notifications`(오늘 created_at 생성분만), `GET/PATCH /notifications/settings`(upsert, radiusKm 1~10 검증), near 대상 선정은 Haversine SQL로 실제 구현(마이페이지 반경 설정과 연동됨), favorite 대상은 favorites 조인.

**문제 (백엔드 개발자 전달사항)**:
1. **(급함) FCM 발송 불가** — `FcmPushService`가 Google이 2024-06 종료한 레거시 API(`fcm/send`+서버키) 사용. HTTP v1(firebase-admin) 마이그레이션 필요.
2. **알림 row 저장이 푸시 성공 뒤** — `DispatchSlotNotificationsUseCase`에서 send 성공 후 insert라, FCM이 죽은 현재 **목록이 항상 빈 배열**. 저장을 푸시와 분리 요청.
3. **"오늘 슬롯만 알림" 필터 없음** — DB 트리거·dispatch에 날짜 조건이 없어 모든 날짜 슬롯에 발송, 푸시 문구만 "오늘" 하드코딩. 정책이 "오늘만"이면 필터 추가 요청.
4. **읽음 처리 API 미노출** — `markRead` 구현은 있으나 라우트 없음.
5. **BE 문서 정정** — GET settings 미초기화 시 404(05-notification.md)가 아니라 실제는 기본값 자동 생성 후 200.

**FCM 푸시 다음 단계 계획(앱 쪽)** — 백엔드 1번 수정 일정이 잡히면 진행:
- `expo-notifications` + Firebase 프로젝트(`google-services.json`/iOS `GoogleService-Info.plist`) + `app.config.ts` plugin → **네이티브 모듈이라 EAS 재빌드 필수**(애플 로그인 어댑터와 묶어 빌드 절약).
- 알림 권한 요청 → FCM 토큰 획득 → `PATCH /notifications/settings`의 `fcmToken`으로 등록(API는 이미 있음).
- iOS는 Firebase에 **APNs 키 등록** 추가 필요(FCM이 APNs로 중계하므로 BE는 무수정). iOS 푸시 테스트는 실기기 필요.

## 10. 남은 작업
- FCM 푸시 셋업(§9 계획) — 백엔드 FCM v1 마이그레이션 후.
- 읽음 처리(백엔드 API 노출 후), 미읽음 도트·로딩/에러 상태 디자인 확정.

## 11. 검증
- `npm run typecheck`, `npm run lint`.
- **알림 데이터는 자연적으로 안 쌓임**(§9-2) — RDS `notifications` 테이블에 수동 INSERT로 검증:
  ```sql
  INSERT INTO notifications (user_id, shop_id, shop_name, type, slot_time, slot_date)
  VALUES ('<내 user uuid>', '1004494913', '준오헤어', 'favorite', '14:00', CURRENT_DATE);
  -- 읽음 행(뱃지 대조): 위와 동일 + read_at = NOW()
  ```
  `created_at` 기본 NOW() → 오늘 필터 충족. INSERT 후 `/notifications`에서 목록·미읽음 도트·탭→상세 이동, 삭제 후 빈 상태 확인.
- 비회원: 로그아웃 → `/notifications` → LoginPromptModal(딤/X → 홈 복귀, 버튼 → /login), 네트워크에 GET 미발생(enabled:false).
