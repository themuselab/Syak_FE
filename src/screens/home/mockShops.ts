// Phase 1 mock 매장 데이터. Phase 3(백엔드)에서 shops 도메인 API로 교체.
export type ShopType = 'reservable' | 'discount' | 'partner';

export type Shop = {
  id: string;
  name: string;
  reviewCount: number;
  address: string;
  badges: string[];
  type: ShopType;
  favorite: boolean;
  priceTier: 1 | 2 | 3; // 1만원대 / 2만원대 / 3만원대
  region: string; // 예: '강남구'
  lat: number;
  lng: number;
};

export const MOCK_SHOPS: Shop[] = [
  { id: '1', name: '모아래쉬', reviewCount: 98, address: '서울 강동구 천호동', badges: ['첫방문 특가', '2만원대'], type: 'partner', favorite: true, priceTier: 2, region: '강동구', lat: 37.5384, lng: 127.1238 },
  { id: '2', name: '모아래쉬', reviewCount: 98, address: '서울 강동구 천호동', badges: ['첫방문 특가', '2만원대'], type: 'reservable', favorite: false, priceTier: 2, region: '강동구', lat: 37.5394, lng: 127.1258 },
  { id: '3', name: '뷰티살롱 라라', reviewCount: 45, address: '서울 강남구 역삼동', badges: ['첫방문 특가', '3만원대'], type: 'discount', favorite: false, priceTier: 3, region: '강남구', lat: 37.5006, lng: 127.0366 },
  { id: '4', name: '네일위크', reviewCount: 212, address: '서울 강남구 신사동', badges: ['1만원대'], type: 'partner', favorite: false, priceTier: 1, region: '강남구', lat: 37.5163, lng: 127.0203 },
  { id: '5', name: '샥 헤어', reviewCount: 77, address: '서울 송파구 잠실동', badges: ['첫방문 특가', '2만원대'], type: 'reservable', favorite: true, priceTier: 2, region: '송파구', lat: 37.5133, lng: 127.1001 },
];
