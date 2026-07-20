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
  slotSummary: { name: string; times: string[] }[]; // 디자이너별 오늘 가능 시각 (실응답 기준 — docs의 "공백 구분 문자열"과 다름)
  eventDesc: string | null;
  eventPrice: string | null;
  isPartner: boolean;
  lat: number | null;
  lng: number | null;
  reviewCount: number;
  photos: string[];
};

// 상세 응답의 메뉴 한 건 (detail.menus 그대로).
export type ShopMenu = {
  name: string;
  price: number | null;
  recommend: boolean;
};

// 상세 응답의 리뷰 한 건 (detail.reviews 그대로 — 작성일은 백엔드 미제공).
export type ShopReview = {
  body: string;
  images: string[];
  keywords: string[];
  ownerReply: string | null;
};

// 예약 수단 (2026-07-18 BE 개편 — syakBE docs/09 §3-4). naver만 실제 온라인 예약, 나머지는 문의/전화.
export type BookingRouteType = 'naver' | 'talktalk' | 'instagram' | 'kakao' | 'phone';

// 서버가 라벨까지 내려줌("네이버로 예약"/"인스타로 문의" 등) — FE는 URL 추측 없이 그대로 사용.
export type ReservationRoute = {
  type: BookingRouteType;
  label: string;
  value: string; // URL 또는 전화번호(type='phone')
};

// 상세 = 목록 필드 + 추가 필드. photos는 상세에서 갤러리 전체(여러 장).
export type ShopDetail = ShopListItem & {
  bizId: string | null;
  bookingUrl: string | null; // 하위호환용 대표 링크 — 신규 코드는 reservationRoutes 사용
  bookingType: BookingRouteType | null; // 대표 링크의 수단 (naver 있으면 naver 최우선)
  reservationRoutes: ReservationRoute[];
  phone: string | null;
  roadAddress: string | null;
  menus: ShopMenu[];
  reviews: ShopReview[];
};

export type ShopListResponse = {
  items: ShopListItem[];
  total: number;
  page: number;
  limit: number;
};

// 백엔드가 실제로 받는 값으로 좁힌 타입 (syakBE Shop.ts / ShopFilter.ts 기준).
export type ShopSort = 'default' | 'price_asc' | 'price_desc' | 'partner';
export type ShopCategory =
  | '네일'
  | '헤어'
  | '왁싱'
  | '반영구'
  | '속눈썹'
  | '마사지'
  | '피부'
  | '태닝';
// '4만원이상'은 실데이터 값 기준 (syakBE 타입 선언은 '4만원대+'로 실데이터와 불일치 — 백엔드 전달).
export type ShopPriceTier = '1만원대' | '2만원대' | '3만원대' | '4만원이상';

// GET /shops 쿼리 파라미터. (배열은 api 레이어에서 콤마 join)
export type ShopListParams = {
  q?: string; // 샵 이름 부분검색 (서버 ilike)
  categories?: ShopCategory[];
  districts?: string[];
  price_tiers?: ShopPriceTier[];
  sort?: ShopSort;
  has_event?: boolean;
  has_slot?: boolean;
  slot_date?: string; // YYYY-MM-DD — 해당 날짜 슬롯 보유 샵만
  lat?: number; // 내 주변 필터(bounding box) — lng와 함께 전송. radius는 안 보냄(서버 기본 5km — 사용자 확정)
  lng?: number;
  page?: number;
  limit?: number;
};
