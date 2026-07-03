import { apiFetch } from '@/shared/api/client';
import type { ShopSlotsResponse, SlotSearchParams, SlotSearchResponse } from './reservation.types';

// GET /slots/shop/:shopId — 샵 예약 가능 슬롯 (dates 생략 = 오늘부터 3일치, 인증 불필요).
export function getShopSlots(shopId: string) {
  return apiFetch<ShopSlotsResponse>(`/slots/shop/${shopId}`);
}

// GET /slots/search — 날짜×시간(다중)에 빈 슬롯이 있는 샵 검색 (홈 예약시간 필터용, 인증 불필요).
export function searchAvailableSlots(params: SlotSearchParams) {
  const sp = new URLSearchParams();
  sp.set('dates', params.dates.join(','));
  sp.set('times', params.times.join(','));
  if (params.districts?.length) sp.set('districts', params.districts.join(','));
  return apiFetch<SlotSearchResponse>(`/slots/search?${sp.toString()}`);
}

// POST /shops/:shopId/reservation-click — 예약 버튼 클릭 애널리틱스 (204).
// 실패해도 사용자 흐름에 영향 없어야 하므로 호출부에서 fire-and-forget으로 쓴다.
export function postReservationClick(shopId: string) {
  return apiFetch<void>(`/shops/${shopId}/reservation-click`, { method: 'POST' });
}
