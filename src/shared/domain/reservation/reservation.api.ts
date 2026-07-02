import { apiFetch } from '@/shared/api/client';
import type { ShopSlotsResponse } from './reservation.types';

// GET /slots/shop/:shopId — 샵 예약 가능 슬롯 (dates 생략 = 오늘부터 3일치, 인증 불필요).
export function getShopSlots(shopId: string) {
  return apiFetch<ShopSlotsResponse>(`/slots/shop/${shopId}`);
}

// POST /shops/:shopId/reservation-click — 예약 버튼 클릭 애널리틱스 (204).
// 실패해도 사용자 흐름에 영향 없어야 하므로 호출부에서 fire-and-forget으로 쓴다.
export function postReservationClick(shopId: string) {
  return apiFetch<void>(`/shops/${shopId}/reservation-click`, { method: 'POST' });
}
