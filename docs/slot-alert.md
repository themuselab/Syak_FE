# 빈자리 알림 신청 (slot alert)

> 상태: **FE 구현 완료(2026-10-29) / 백엔드 API 병행 개발 중** — 아래 계약대로 코딩. BE 배포 전엔 신청·목록 호출이 실패(에러 문구)한다.
> 디자인 출처: 디자이너 시안 2026-10-29(사장님이 이미지로 공유 — `designs/`·`design.pen` 미반영). 시안에 없던 부분은 §7 "임시 결정"에 모았다.

## 1. 범위
사용자가 "이 샵, 이 날짜·시간에 자리가 나면 알려줘"를 신청하고, 알림함에서 신청 현황을 보고 지운다.
- 진입점 ① 홈 목록 카드 "빈자리 알림" 버튼 ② 샵 상세 "예약 가능 시간" 섹션의 "빈자리 알림 설정하기" 카드
- 알림 설정 시트 → 완료 토스트([내역보기] → 알림함 신청 현황)
- 알림함 두 탭(받은 알림 / 신청 현황 N), 신청 현황 편집(삭제)
- 마이: "샥 알림" → "알림함"(받은 알림 + 신청 현황)

## 2. 사장님 결정
- 시간 칩 = 그날 **영업시간을 30분 단위로**(영업시간 데이터 없으면 09:00–21:00). 마감 시각 자체는 제외(10:00–21:00 → 10:00…20:30), 브레이크타임 안 시각 제외.
- **지금 비어 있는(예약 가능) 시간은 고를 수 없다**(회색 비활성) — 비지 않은 시간만 알림 신청. 오늘의 지난 시간은 아예 안 보인다.
- 비회원이 어느 "빈자리 알림" 진입점을 눌러도 기존 로그인 유도 모달.
- 신청은 그 시간에 알림 1회 보내거나(`notified`) 시간이 지나면(`expired`) 종료 → "종료된 알림".

## 3. 백엔드 계약 (base `/api/v1`, 쿠키 인증 — `apiFetch`)
| 메서드 | 경로 | 바디 / 응답 |
|---|---|---|
| POST | `/notifications/slot-alerts` | `{ shopId, date:'YYYY-MM-DD', times:['HH:MM'] }` → 201 `{ created }` |
| GET | `/notifications/slot-alerts` | `{ alerts: SlotAlert[] }` (flat — 앱이 샵 → 날짜로 묶음) |
| DELETE | `/notifications/slot-alerts` | `{ ids: string[] }` → 204 |

`SlotAlert = { id, shopId, shopName, shopRegion|null, shopPhoto|null, date, time, status:'active'|'ended', endedReason:'notified'|'expired'|null, notifiedAt|null, createdAt }`

- 쿼리 키 `['notifications','slot-alerts']` (`SLOT_ALERTS_KEY`). 신청·삭제 성공 시 invalidate(재조회).
- 시트의 날짜·빈자리는 기존 `GET /shops/:id`(businessHours) + `GET /slots/shop/:id`(3일치) 캐시를 그대로 쓴다.

## 4. 화면 & 흐름
```
홈 목록 카드 (ShopListCard feed)
  ⏰ 오늘 15:00 15:30 16:00 외 +3        [🔔 빈자리 알림]   ← slotSummary(오늘), 지난 시각 제외, 3개 + "외 +N"
  ⏰ 당일 예약이 마감되었어요(회색)      [🔔 빈자리 알림]
샵 상세 "예약 가능 시간" (AvailabilitySection — 기존 빗금 시간 막대 대체)
  예약 가능 시간 (i)  → 탭하면 검은 말풍선 "오늘부터 3일간의 예약 가능한 시간을 확인할 수 있어요." (3초 후 닫힘)
  [오늘 (화)][내일 (수)][모레 (목)]  선택 = 진한 채움
  15:00 · 15:30 · 16:00 …  / 없으면 "예약이 모두 마감되었어요"
  [🔔 빈자리 알림 설정하기 / 원하는 시간에 자리가 나면 알려드려요 >]  → 시트(그 탭 날짜 선택 상태)
빈자리 알림 설정 시트 (SlotAlertSheet, RN Modal slide)
  날짜 선택(3칸, 선택 = 핑크 테두리·틴트) / 시간 선택 "복수 선택 가능"(칩 wrap, 선택 = 핑크)
  [빈자리 알림 받기](1개 이상 선택 시 활성) → POST → 시트 닫고 토스트 / "나중에 할게요"
완료 토스트 (SlotAlertToast, 3초): ✓ 빈자리 알림 신청 완료!  [내역보기] → /notifications?tab=requests
알림함 (/notifications)
  헤더 < + "알림함" (+ 신청 현황 탭에서 우상단 "편집"/"완료")
  [받은 알림] [신청 현황 N]   N = active 개수
  신청 현황: 샵 카드(사진·"내일 · 전농동"·샵 이름·> → 샵 상세) + 날짜 줄("오늘 화")별 시간 칩
             아래 "종료된 알림" 섹션(회색 카드)
  편집: 칩에 × → 로컬에서만 빠짐 → "완료" 때 DELETE 한 번(ids 전체)
        지운 게 있는 채로 뒤로(헤더 <·하드웨어·브라우저)/탭 전환 → "편집을 그만할까요?" 모달
          [계속 편집하기] / 나가기(지운 것 버리고 그 동작 계속)
```

## 5. 파일 구조
```
src/shared/domain/notification/
  slotAlert.types.ts      SlotAlert·입력/응답 타입
  slotAlert.api.ts        getSlotAlerts / createSlotAlerts / deleteSlotAlerts
  slotAlert.queries.ts    useSlotAlerts(enabled) / useCreateSlotAlerts / useDeleteSlotAlerts, SLOT_ALERTS_KEY
src/shared/lib/slotTimes.ts   threeDays·businessHalfHours(영업시간 30분 칸)·openTimesOn·normalizeHM 등 공용 시간 유틸
                              (shop-detail/businessHours.ts의 toMin·entryFor도 여기로 옮김)
src/shared/ui/slot-alert/
  SlotAlertSheet.tsx      알림 설정 시트 (shop·slots·alerts 쿼리 직접 사용)
  SlotAlertToast.tsx      완료 토스트
  useSlotAlertSheet.tsx   진입점 공용 훅: open(shopId, dayIndex) — 로그인 게이트 + 시트 + 토스트 element
src/shared/ui/ShopListCard.tsx            feed 카드에 오늘 빈자리 줄 + "빈자리 알림" 버튼(onPressSlotAlert)
src/screens/home/HomeScreen.tsx           useSlotAlertSheet 1개 → ShopBottomSheet(카드·인라인 상세)로 opener 전달
src/screens/home/shopToView.ts            availability 문구 → todayTimes: string[] (todayOpenTimes)
src/screens/shop-detail/
  shopDetailToView.ts                     timeline(시간 막대) → availability: { key, prefix, weekday, times }[]
  components/AvailabilitySection.tsx      새 "예약 가능 시간" 섹션
  ShopDetailBody/Screen/Sheet.tsx         onOpenSlotAlert 전달(라우트 화면은 자체 훅, 홈 시트는 홈 훅)
src/screens/notification/
  NotificationScreen.tsx                  탭·편집·나가기 가드(beforeRemove)
  groupSlotAlerts.ts                      flat → 샵 카드 → 날짜 줄(오늘/내일/모레/어제/M.DD + 요일)
  components/SlotAlertRequests.tsx        신청 현황 목록(진행 중 + 종료된 알림)
  components/SlotAlertCard.tsx            샵 카드
  components/EditExitModal.tsx            "편집을 그만할까요?"
src/shared/ui/BackHeader.tsx              right 슬롯 추가(편집/완료)
src/screens/my/MyScreen.tsx               "샥 알림" → "알림함"(Inbox 아이콘), 관심동네 미설정 시 "설정하기 >" 핑크
```

## 6. 시간 칩 상태 (SlotAlertSheet)
| 상태 | 조건 | 표시 |
|---|---|---|
| 숨김 | 오늘 & 시각 ≤ 지금 | 안 보임 |
| 비활성 | 그 30분 칸에 빈자리 슬롯 있음(10:20 → 10:00 칸) | 회색, 탭 불가 |
| 비활성 | 같은 샵·날짜·시간 active 신청이 이미 있음 | 회색, 탭 불가(중복 신청 방지) |
| 선택 가능 | 그 외 | 흰 칩 → 탭하면 핑크 |
- 날짜를 바꾸면 선택이 초기화된다(POST 1회 = 날짜 1개).
- 쉬는 날(영업시간에 그 요일 start/end 없음) → "이 날은 휴무일이에요". 칩이 하나도 없으면 "알림을 받을 수 있는 시간이 없어요".

## 7. 임시 결정 (시안·명세에 없어 기존 패턴으로 정함 — 디자이너 확인 항목)
- 시트 레이아웃·여백·칩 크기, 카드 줄의 "오늘"(진한 회색)·시각(핑크)·"외 +N"(회색) 색 분리 — 이미지 설명 기준으로 기존 토큰에 맞춤.
- 이미 신청한 시간은 비활성(선택 불가)으로 표시.
- 휴무일/칩 없음 안내 문구, 신청 현황 빈 상태 문구("신청한 빈자리 알림이 없어요"), 신청·삭제 실패 문구.
- 상세 탭 라벨은 "오늘 (화)" 형식(시트와 동일). 마감 문구는 회색 글자만(박스 없음).
- 신청 현황 카드 메타 "내일 · 전농동"의 날짜 = 카드에서 가장 가까운(종료 섹션은 가장 최근) 날짜.
- 종료된 알림도 편집 모드에서 ×로 지울 수 있다.
- 편집 중 지운 게 없으면 뒤로/탭 전환 시 모달 없이 편집만 끝낸다. 모달의 "나가기" = 지운 것 버리고 원래 하려던 동작(뒤로/탭 전환) 계속.
- 비회원이 "신청 현황" 탭을 누르면 로그인 유도 모달(탭은 안 바뀜). 탭 카운트 N은 회원만.
- 샵 상세 라우트 화면의 토스트는 하단 예약 바 위(insets.bottom + 84)에 띄운다.

## 8. 검증
- `npx tsc --noEmit`, `npx expo export --platform web` 통과.
- BE 미배포 상태 확인: export를 로컬 서빙 + headless Chrome에서 DevTools Fetch 가로채기로 가짜 응답(`/auth/me`·`/shops/:id`·`/slots/shop/:id`·`/notifications/slot-alerts`)을 주고 시트·신청 현황 화면 스크린샷 확인.
- BE 배포 후: 신청 → 알림함 신청 현황 반영, 편집 삭제 → 재조회 반영, 알림 발송 후 종료된 알림 이동을 실기기에서 확인.
