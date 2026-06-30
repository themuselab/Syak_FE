// 샵(매장) 도메인 타입. 백엔드 계약: ../syakBE/docs/02-catalog.md (GET /shops, 인증 불필요).

// 목록 응답의 샵 한 건 (백엔드 필드 그대로).
export type ShopListItem = {
  id: string;
  name: string;
  region: string; // 현재 항상 "서울"
  district: string | null; // 구
  minPrice: number | null;
  priceTier: string | null; // 예 "1만원대"
  categories: string[]; // 대표 업종
  todayOpen: boolean;
  slotSummary: { name: string; times: string }[]; // times = 공백 구분 문자열
  eventDesc: string | null;
  eventPrice: string | null;
  isPartner: boolean;
  lat: number | null;
  lng: number | null;
  photos: string[];
};

// 상세 = 목록 필드 + 4개.
export type ShopDetail = ShopListItem & {
  bizId: string | null;
  reviewCount: number;
  bookingUrl: string | null;
  phone: string | null;
};

export type ShopListResponse = {
  items: ShopListItem[];
  total: number;
  page: number;
  limit: number;
};

// 백엔드가 실제로 받는 값으로 좁힌 타입.
export type ShopSort = 'default' | 'price_asc' | 'partner';
export type ShopCategory = '헤어' | '네일' | '왁싱' | '반영구';
export type ShopPriceTier = '1만원대' | '2만원대' | '3만원대' | '4만원이상';

// GET /shops 쿼리 파라미터. (배열은 api 레이어에서 콤마 join)
export type ShopListParams = {
  categories?: ShopCategory[];
  districts?: string[];
  price_tiers?: ShopPriceTier[];
  sort?: ShopSort;
  has_event?: boolean;
  has_slot?: boolean;
  page?: number;
  limit?: number;
};
