// 예약 슬롯 도메인 타입. 백엔드 계약: ../syakBE/docs/03-reservation.md
// 예약 생성 API는 없음 — 예약 확정은 외부 링크(bookingUrl)로 처리.

// GET /slots/shop/:shopId 응답의 슬롯 한 건.
export type ShopSlot = {
  shopId: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:MM'
};

export type ShopSlotsResponse = {
  slots: ShopSlot[];
};
