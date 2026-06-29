// Phase 1 mock 샵 상세 데이터. Phase 3(백엔드)에서 shops 도메인 API로 교체.
// 기본값(오늘/메뉴/정보/리뷰)은 designs/상세페이지 캡처 및 design.pen(PA3vj) 내용과 1:1 일치.

export type TimeSlot = {
  time: string;
  note?: string; // 예: '1자리 남았어요' (칩 옆 핑크 텍스트)
};

export type AvailabilityPeriod = {
  label: string; // 예: '오전 (9:00 - 12:00)'
  slots: TimeSlot[];
  closedMessage?: string; // 슬롯이 없을 때 표시 (예: '마감되었습니다')
};

export type DayAvailability = {
  key: string;
  label: string; // 예: '오늘 (화)'
  periods: AvailabilityPeriod[];
};

export type MenuItem = {
  name: string;
  price: string; // 표시 문자열 (예: '75,000원')
};

export type InfoRow = {
  label: string;
  value: string;
};

export type ReviewItem = {
  text: string;
  tags: string[];
  date: string;
};

export type ShopDetail = {
  id: string;
  name: string;
  category: string;
  reviewCount: number;
  badges: string[];
  favorite: boolean;
  imageCount: number; // placeholder 이미지 개수 (Phase 1)
  phone: string;
  availability: DayAvailability[];
  menus: MenuItem[];
  info: InfoRow[];
  reviews: ReviewItem[];
};

const REVIEW_TEXT =
  '편안한 분위기라 속눈썹펌을 하는 동시에 한시간 동안 잘 쉬다가는 느낌이었습니다. 컬도 원하는 모양으로 너무 과하지 않은 자연스러운 컬로 만들어주셨네요. 거의 정착해서 받고 있어서 아주 대만족이랍니다.';
const REVIEW_TAGS = ['맞춤 디자인을 잘해줘요', '자연스러워요', '눈이 편안해요', '눈이 편안해요', '눈이 편안해요'];

export const MOCK_SHOP_DETAIL: ShopDetail = {
  id: '1',
  name: '모아래쉬',
  category: '속눈썹증모, 연장',
  reviewCount: 98,
  badges: ['첫방문 특가', '2만원대'],
  favorite: true,
  imageCount: 4,
  phone: '02-3295-2978',
  availability: [
    {
      key: 'today',
      label: '오늘 (화)',
      periods: [
        { label: '오전 (9:00 - 12:00)', slots: [], closedMessage: '마감되었습니다' },
        { label: '오후 (12:00 - 18:00)', slots: [{ time: '14:00' }, { time: '16:00' }] },
        { label: '저녁 (18:00 - )', slots: [{ time: '22:30', note: '1자리 남았어요' }] },
      ],
    },
    {
      key: 'tomorrow',
      label: '내일 (수)',
      periods: [
        { label: '오전 (9:00 - 12:00)', slots: [{ time: '10:00' }, { time: '11:00' }] },
        { label: '오후 (12:00 - 18:00)', slots: [{ time: '13:00' }, { time: '15:00' }, { time: '17:00' }] },
        { label: '저녁 (18:00 - )', slots: [{ time: '19:00' }, { time: '20:00' }] },
      ],
    },
    {
      key: 'day-after',
      label: '모레 (목)',
      periods: [
        { label: '오전 (9:00 - 12:00)', slots: [], closedMessage: '마감되었습니다' },
        { label: '오후 (12:00 - 18:00)', slots: [{ time: '14:30' }] },
        { label: '저녁 (18:00 - )', slots: [], closedMessage: '마감되었습니다' },
      ],
    },
  ],
  menus: Array.from({ length: 7 }, () => ({
    name: '[아이돌래쉬]마스카라포인트연장',
    price: '75,000원',
  })),
  info: [
    { label: '주소', value: '서울 동대문구 망우로6길 8 1층' },
    { label: '오늘 예약', value: '오늘은 예약 마감이에요' },
    { label: '전화', value: '02-3295-2978' },
  ],
  reviews: [
    { text: REVIEW_TEXT, tags: REVIEW_TAGS, date: '5.31.일' },
    { text: REVIEW_TEXT, tags: REVIEW_TAGS, date: '5.31.일' },
  ],
};

export function getShopDetail(_shopId?: string): ShopDetail {
  // Phase 1: id와 무관하게 단일 mock 반환. Phase 3에서 id로 조회.
  return MOCK_SHOP_DETAIL;
}
