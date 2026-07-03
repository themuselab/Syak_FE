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

// GET /slots/search 파라미터 (dates·times 필수 — 비면 서버 validation 에러).
export type SlotSearchParams = {
  dates: string[]; // 'YYYY-MM-DD'
  times: string[]; // 'HH:MM'
  districts?: string[];
};

// GET /slots/search 응답의 샵 한 건.
export type ShopWithSlots = {
  shopId: string;
  shopName: string;
  district: string | null;
  availableSlots: { date: string; time: string }[];
};

export type SlotSearchResponse = {
  shops: ShopWithSlots[];
  count: number;
};
