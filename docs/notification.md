# 알림 (알림 목록 · 비회원 로그인 유도 모달)

> 상태: **백엔드 연동 + FCM 푸시까지 완료** — GET /notifications 목록·미읽음 뱃지·탭 시 읽음 처리(2026-07-04)·비회원 게이팅 + **FCM 푸시 셋업·안드 실기기 수신 검증(2026-07-07, §9·§11)**.
> 2026-07-04 백엔드 업데이트로 §9 전달사항 전부 해소(FCM v1·row 저장 분리·오늘만·읽음 API·문서 정정). 알림 기능은 iOS 푸시 검증(APNs 키 — Apple Developer 결제 후)만 남음.
> 디자인 원본: `designs/알림/알림.png`, `designs/비회원로그인 알림/비회원 로그인 알림.png`,
> `designs/design.pen` 프레임 `SXtVD`(알림), `B9m9C`(비회원 모달 — 카드 `KfxCM`, 딤 `JihSb`).

## 1. 범위
알림 목록 화면(`/notifications`) 백엔드 연동 + 비회원 로그인 유도 게이팅. FCM 푸시 수신은 다음 단계(§9).

## 2. 화면 & 흐름
```
/notifications (알림)                      [src/screens/notification/NotificationScreen.tsx]
  ├ 헤더: 뒤로가기(←) + "알림" 타이틀
  ├ 비회원 → 인화면 안내(GuestNotificationView — 쿼리 enabled:false, 401 요청 자체가 안 나감)
  │    ├ 2026-07-14 QA 비로그인 #5: LoginPromptModal 차단 → 중앙 안내 문구 + 하단 "로그인 하러가기" 버튼으로 변경
  │    │  (팝업이 화면을 막지 않음. 문구·레이아웃 디자인 부재 — 임시, 디자이너 확인 항목)
  │    ├ 뒤로는 BackHeader(기존 스택 뒤로가기 그대로)
  │    └ "로그인 하러가기" → replace('/login') — push면 이 화면이 스택에 남아 로그인 화면을 계속 덮음
  │    └ "앱 소식" 목록 노출은 BE 알림 타입(favorite/near뿐) 신설 후 — BE 전달사항
  └ 회원 → useNotifications (GET /notifications, 오늘 생성분만)
       ├ 로딩 → 중앙 스피너 (디자인 미제공, 임시)
       ├ 에러 → 안내 + "다시 시도"(refetch) (디자인 미제공, 임시)
       ├ 빈 목록 → "새로운 알림이 없습니다"
       └ 목록 → 행 탭 시 [미읽음이면 읽음 처리(fire-and-forget)] + router.push(`/shop/${shopId}`)
```
- 문구: 제목 `{shopName} {slotTime} 빈자리 알림!` + 고정 본문(캡처 그대로, **타입별 구분 없음 — 사용자 확정**).
- 미읽음: `readAt === null`이면 제목 좌측 6px 핑크 도트(`primary.500`) — **디자인 미제공 임시안(사용자 확정)**.
- **읽음 처리(2026-07-04)**: **탭한 알림만** 읽음 — 사용자 확정(화면 진입 시 전체 읽음 아님). `useMarkNotificationRead()`가
  `PATCH /notifications/:id/read`(항상 204·멱등)를 쏘며 **낙관 갱신**(도트 즉시 제거) + 실패 시 해당 항목만 원복.
  요청은 상세 이동을 막지 않고(fire-and-forget), 이미 읽은 알림 재탭 시 요청 없음.
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
  notification.api.ts             # getNotifications, markNotificationRead, getNotificationSettings, updateNotificationSettings
  notification.queries.ts         # useNotifications(enabled)·useMarkNotificationRead·useNotificationSettings(enabled)·useUpdateNotificationSettings
  push.ts                         # FCM: usePushSetup(로그인 시 토큰 등록)·탭 라우팅·deleteToken — dynamic import 가드(§9)
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
- **앱이 켜져 있을 때(포그라운드) 푸시 배너 미표시** — OS가 포그라운드에선 FCM 배너를 안 띄워줌(별도 로컬 알림 필요). 현재는 알림 목록 캐시만 갱신. 백그라운드·종료 상태에선 다른 앱과 동일하게 뜸.
- ~~읽음 처리 없음(BE API 미노출) — 뱃지 표시만.~~ → **2026-07-04 연동 완료**(§2). 읽음 처리 실패 시 안내 UI 없이 도트만 원복(토스트 인프라 부재 — 즐겨찾기와 동일 정책).

## 9. ⚠️ 백엔드 현황 (2026-07-03 코드 조사 — syakBE는 우리가 수정 안 함)

**동작하는 것**: `GET /notifications`(오늘 created_at 생성분만), `GET/PATCH /notifications/settings`(upsert, radiusKm 1~10 검증), near 대상 선정은 Haversine SQL로 실제 구현(마이페이지 반경 설정과 연동됨), favorite 대상은 favorites 조인.

**문제 (백엔드 개발자 전달사항)** — ✅ **2026-07-04 배포(`cd10fec`~)로 아래 5건 전부 해소 확인(코드 대조 완료)**:
1. ~~**(급함) FCM 발송 불가** — `FcmPushService`가 Google이 2024-06 종료한 레거시 API(`fcm/send`+서버키) 사용. HTTP v1(firebase-admin) 마이그레이션 필요.~~ → firebase-admin v1로 마이그레이션 완료(`FCM_SERVICE_ACCOUNT_JSON` env, lazy init — 미설정이어도 서버 안 죽음). EC2 서버 설정까지 완료(백엔드 개발자 확인).
2. ~~**알림 row 저장이 푸시 성공 뒤** — 목록이 항상 빈 배열.~~ → insert를 push와 분리 — 푸시 실패해도 알림 목록엔 남음.
3. ~~**"오늘 슬롯만 알림" 필터 없음**~~ → dispatch에 `todayOnly=true` 기본값 — 오늘 날짜 슬롯만 발송.
4. ~~**읽음 처리 API 미노출**~~ → `PATCH /notifications/:id/read` 라우트 노출(FE 연동 완료 §2).
5. ~~**BE 문서 정정** — GET settings 404~~ → 코드 확인: 미초기화 시 기본값 자동 생성 후 200(FE는 원래 호환).

**신규 전달사항 (2026-07-04)**:
- `PATCH /notifications/:id/read`가 **BE 문서(`05-notification.md`·`API_DOCS.md`)에 미기재** — 문서 갱신 요청. (계약은 코드로 확인: 인증 필요, 항상 204, `read_at IS NULL`일 때만 갱신하는 멱등 쿼리)

**신규 전달사항 (2026-07-05)**:
- **fcmToken 해제 수단 없음** — `PATCH /notifications/settings`의 upsert가 `COALESCE($8, fcm_token)`이라 `fcmToken: null`을 보내도 기존 값이 유지됨. 로그아웃·수신 거부 시 서버 토큰을 지울 방법이 없어 FE는 기기 측 `deleteToken()`으로 무효화 중(발송돼도 전달 안 됨). null 허용 또는 해제 API 검토 요청.

**FCM 푸시 — 앱 구현 완료(2026-07-05)**. 라이브러리는 계획의 ~~expo-notifications~~가 아닌 **`@react-native-firebase/app`+`messaging`(v25)** — expo-notifications의 기기 토큰은 iOS에서 APNs 토큰이라 FCM 토큰으로 발송하는 백엔드와 안 맞음([decisions.md](./decisions.md)). 구조:
- **`src/shared/domain/notification/push.ts`**: `usePushSetup()`(루트 레이아웃, 로그인 전환 감지) → `registerPushToken()` = 권한 요청(iOS `requestPermission` / 안드13+ `POST_NOTIFICATIONS`) → `getToken()` → `PATCH /notifications/settings { fcmToken }` + `onTokenRefresh` 재등록. 전부 dynamic import 가드(web·Expo Go·구 dev build 조용히 통과 — 카카오/네이버 패턴).
- **알림 탭 라우팅**: 백그라운드(`onNotificationOpenedApp`)·종료 상태(`getInitialNotification`, 스플래시 replace와 경합 방지로 500ms 지연) → payload `data.shopId`로 `/shop/:id` 이동. 포그라운드 수신은 알림 목록 캐시 invalidate만(배너 미표시 — 임시 동작 §8).
- **로그아웃**: `useSignOut`이 signOut 전 `deleteToken()`(기기 토큰 무효화) — 서버 토큰 삭제 API가 없어서(§9 신규 전달사항) 클라 측 대응.
- **설정/빌드**: app.config.ts가 `google-services.json`/`GoogleService-Info.plist` **존재할 때만** firebase plugin·`googleServicesFile`·iOS static frameworks를 포함(파일은 .gitignore, EAS는 file 타입 env `GOOGLE_SERVICES_JSON`/`GOOGLE_SERVICE_INFO_PLIST`). `POST_NOTIFICATIONS` 권한·`aps-environment` entitlement는 app.json. **네이티브 모듈이라 EAS 재빌드 필수** — 구 dev build에선 푸시만 비활성(가드), 나머지 정상.
- **iOS 잔여(코드 완료, 계정 대기)**: Apple Developer 유료 결제 후 APNs 키(.p8) 발급 → Firebase 콘솔 Cloud Messaging에 업로드 → iOS 빌드로 검증. 그 전까지 iOS 푸시만 미동작.

## 10. 남은 작업
- ~~FCM 푸시 셋업~~ — **2026-07-05 앱 구현 완료(§9).** 잔여: ① Firebase 콘솔에 앱 등록 후 설정 파일 2개 수령(사람) ② EAS file env 등록 + 안드 dev build 재빌드 ③ 실기기 검증 ④ iOS는 Apple Developer 결제 후 APNs 키 등록·검증.
- ~~읽음 처리(백엔드 API 노출 후)~~ — **2026-07-04 완료.** 미읽음 도트·로딩/에러 상태 디자인 확정은 계속 대기.
- 포그라운드 수신 시 배너 표시(현재 미표시 — §8) 정책·디자인 확정 시 로컬 알림 추가 검토.

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
- **읽음 처리(2026-07-04, 웹 + 로컬 BE + 쿠키 주입)**: 미읽음 2건 시드 → 도트 2개 → 탭 → 도트 즉시 제거 + `PATCH /:id/read` 204 + 상세 이동 → DB `read_at` 반영 → 새 세션 재진입에도 읽음 유지 → 읽은 항목 재탭 시 PATCH 미발생 → BE 중단 상태 탭 → 이동은 정상·복귀 시 도트 원복(롤백) 전부 확인.
- **FCM 푸시(2026-07-07 안드 실기기 검증 완료 — 갤럭시탭 + 운영 EC2 API)**: 로그인 → 권한 허용 → FCM 토큰 발급(`[push] FCM token:` 로그) + **운영 서버에 저장** → Firebase 콘솔 테스트 메시지 **수신 확인**(백그라운드, 시스템 알림 정상 표시). 이때부터 운영 슬롯 오픈 시 실제 발송 경로 활성. 잔여 시나리오(수시 확인): 커스텀 데이터 `shopId` 탭 → 샵 상세 이동, 권한 거부, 로그아웃→재로그인 토큰 재등록.
- 검증 환경 참고: `.env`의 `EXPO_PUBLIC_API_URL`을 운영(`http://54.116.107.78/api/v1`)으로 전환(2026-07-07) — 평소 개발은 로컬 도커 불필요. **출시 전 도메인+HTTPS 필수**(production 빌드는 안드 cleartext 차단·iOS ATS — BE 전달).
