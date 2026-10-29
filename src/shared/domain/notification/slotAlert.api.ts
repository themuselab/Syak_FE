import { apiFetch } from '@/shared/api/client';

import type {
  CreateSlotAlertsInput,
  CreateSlotAlertsResponse,
  SlotAlertListResponse,
} from './slotAlert.types';

// GET /notifications/slot-alerts — 내 빈자리 알림 신청 목록(진행 중 + 종료, 인증 필요).
export function getSlotAlerts() {
  return apiFetch<SlotAlertListResponse>('/notifications/slot-alerts');
}

// POST /notifications/slot-alerts — 한 샵·한 날짜의 여러 시간 신청 (201 { created }).
export function createSlotAlerts(input: CreateSlotAlertsInput) {
  return apiFetch<CreateSlotAlertsResponse>('/notifications/slot-alerts', {
    method: 'POST',
    body: input,
  });
}

// DELETE /notifications/slot-alerts — 여러 건 한 번에 삭제 (204). 편집 "완료" 시 1회 호출.
export function deleteSlotAlerts(ids: string[]) {
  return apiFetch<void>('/notifications/slot-alerts', { method: 'DELETE', body: { ids } });
}
