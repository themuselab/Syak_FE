import type { ShopSlot } from '@/shared/domain/reservation/reservation.types';
import type { ShopDetail } from '@/shared/domain/shops/shops.types';

// 상세 화면 뷰모델. 백엔드 ShopDetail + 슬롯(3일치)을 각 섹션 컴포넌트가 쓰는 형태로 변환한다.
// (디자인 문구·구조는 designs/상세페이지 캡처 및 design.pen(PA3vj) 기준 — 기존 mock 구조 계승)

export type TimeSlot = {
  time: string;
  note?: string; // 예: '1자리 남았어요' — 백엔드에 잔여수 없어 현재 미사용(갭)
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

export type ShopDetailView = {
  id: string;
  name: string;
  category: string;
  reviewCount: number;
  badges: string[];
  photos: string[];
  phone: string | null;
  bookingUrl: string | null;
  availability: DayAvailability[];
  menus: MenuItem[]; // 백엔드 미제공(갭) → 빈 배열 = 섹션 빈 상태
  info: InfoRow[];
  reviews: ReviewItem[]; // 백엔드 미제공(갭) → 빈 배열 = 섹션 빈 상태
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_META = [
  { key: 'today', prefix: '오늘' },
  { key: 'tomorrow', prefix: '내일' },
  { key: 'day-after', prefix: '모레' },
];

function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// 슬롯(flat)을 디자인 구조로: 오늘부터 3일 고정 × 오전/오후/저녁 구간. 빈 구간은 '마감되었습니다'.
function buildAvailability(slots: ShopSlot[], now: Date): DayAvailability[] {
  return DAY_META.map((meta, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateKey = toDateKey(d);
    const times = slots.filter((s) => s.date === dateKey).map((s) => s.startTime);

    // 'HH:MM' 문자열 비교 = 시간순 비교
    const periodOf = (from: string | null, to: string | null) =>
      times.filter((t) => (from === null || t >= from) && (to === null || t < to));
    const toPeriod = (label: string, list: string[]): AvailabilityPeriod =>
      list.length > 0
        ? { label, slots: list.map((time) => ({ time })) }
        : { label, slots: [], closedMessage: '마감되었습니다' };

    return {
      key: meta.key,
      label: `${meta.prefix} (${WEEKDAYS[d.getDay()]})`,
      periods: [
        toPeriod('오전 (9:00 - 12:00)', periodOf(null, '12:00')),
        toPeriod('오후 (12:00 - 18:00)', periodOf('12:00', '18:00')),
        toPeriod('저녁 (18:00 - )', periodOf('18:00', null)),
      ],
    };
  });
}

export function toShopDetailView(
  shop: ShopDetail,
  slots: ShopSlot[],
  now: Date = new Date(),
): ShopDetailView {
  const badges: string[] = [];
  if (shop.eventDesc) badges.push(shop.eventDesc);
  if (shop.priceTier) badges.push(shop.priceTier);

  const availability = buildAvailability(slots, now);
  const hasTodaySlot = availability[0].periods.some((p) => p.slots.length > 0);

  const info: InfoRow[] = [
    // 도로명 주소는 백엔드 미노출(갭) — 현재 region+district까지.
    { label: '주소', value: [shop.region, shop.district].filter(Boolean).join(' ') },
    { label: '오늘 예약', value: hasTodaySlot ? '오늘 예약 가능해요' : '오늘은 예약 마감이에요' },
    ...(shop.phone ? [{ label: '전화', value: shop.phone }] : []),
  ];

  return {
    id: shop.id,
    name: shop.name,
    category: shop.categories.join(', '),
    reviewCount: shop.reviewCount,
    badges,
    photos: shop.photos,
    phone: shop.phone,
    bookingUrl: shop.bookingUrl,
    availability,
    menus: [], // 갭 #1: 백엔드가 detail.menus 노출하면 매핑 추가
    info,
    reviews: [], // 갭 #2: 백엔드가 detail.reviews 노출하면 매핑 추가
  };
}
