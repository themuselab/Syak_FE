// 빈자리 알림 신청(slot alert) 타입 — 2026-10-29 신규 BE 계약.
// 사용자가 "이 샵, 이 날짜·시간에 자리가 나면 알려줘"를 신청한다. 한 번 알림을 보내거나(notified)
// 그 시간이 지나면(expired) 종료된다.

export type SlotAlertStatus = 'active' | 'ended';
export type SlotAlertEndedReason = 'notified' | 'expired';

// GET /notifications/slot-alerts 의 한 행(샵·날짜·시간 단위 flat). 화면에서 샵 → 날짜로 묶는다.
export type SlotAlert = {
  id: string;
  shopId: string;
  shopName: string;
  shopRegion: string | null; // "전농동"
  shopPhoto: string | null;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM'
  status: SlotAlertStatus;
  endedReason: SlotAlertEndedReason | null;
  notifiedAt: string | null;
  createdAt: string;
};

export type SlotAlertListResponse = { alerts: SlotAlert[] };

// POST /notifications/slot-alerts
export type CreateSlotAlertsInput = {
  shopId: string;
  date: string; // 'YYYY-MM-DD'
  times: string[]; // 'HH:MM'
};

export type CreateSlotAlertsResponse = { created: number };
