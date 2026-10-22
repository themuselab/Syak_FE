import type { ShopSlot } from '@/shared/domain/reservation/reservation.types';
import type { ReservationRoute, ShopDetail } from '@/shared/domain/shops/shops.types';
import { toDateKey } from '@/shared/lib/date';

import { type HoursView, toHoursView } from './businessHours';
import { locationLabelOf } from '../home/shopToView';

// 상세 화면 뷰모델. 백엔드 ShopDetail + 슬롯(3일치)을 각 섹션 컴포넌트가 쓰는 형태로 변환한다.
// 디자인: 디자이너 시안 2026-10-15 "샵 상세" / "샵 상세-빈자리 마감".

// 빈자리 시간 막대의 30분 칸 상태.
//  past   = 이미 지난 시간(빗금)   open = 빈자리(핑크)   closed = 예약 마감(회색)
export type HalfState = 'past' | 'open' | 'closed';
export type HourCell = { hour: number; halves: [HalfState, HalfState] };

export type DayTimeline = {
  key: string;
  label: string; // "오늘 (화)"
  date: string; // "10.01"
  cells: HourCell[];
  hasOpen: boolean; // false면 "예약이 모두 마감되었어요"
};

export type MenuItem = { name: string; price: string };

export type ReviewItem = {
  text: string;
  tags: string[];
  date?: string; // 방문일("10.8.목") — 새로 수집된 리뷰에만 있다. 있으면 표시.
};

export type ShopDetailView = {
  id: string;
  name: string;
  category: string; // "네일샵"
  locationLabel: string; // "320m 전농동" / 위치 미동의 시 "전농동"
  rating: number | null; // 방문자 평점 — 수집 전이면 null(★ 숨김)
  hours: HoursView | null; // 영업시간 — 수집 전이면 null(줄 숨김)
  reviewCount: number;
  photos: string[];
  eventDesc: string | null;
  address: string | null;
  todayOpen: boolean;
  phone: string | null;
  instagram: { handle: string; url: string } | null;
  introduction: string | null;
  menus: MenuItem[];
  timeline: DayTimeline[];
  reviews: ReviewItem[];
  // 하단 바. 오른쪽 = 네이버 예약(없으면 카카오·톡톡 등 다른 온라인 예약), 왼쪽 = 인스타 → 전화.
  bookingRoute: ReservationRoute | null;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_PREFIX = ['오늘', '내일', '모레'];
// 시간 막대 기본 범위. 영업시간 데이터가 없어 고정 범위를 쓰고, 슬롯이 그 밖에 있으면 넓힌다.
const DEFAULT_FROM = 9;
const DEFAULT_TO = 21;

const pad2 = (n: number) => String(n).padStart(2, '0');

// 슬롯(flat) → 3일치 시간 막대. 30분 단위 칸마다 지남/빈자리/마감을 정한다.
function buildTimeline(slots: ShopSlot[], now: Date): DayTimeline[] {
  // 3일 전체에서 같은 시간 범위를 써야 날짜를 바꿔도 막대 길이가 흔들리지 않는다.
  const hours = slots.map((s) => Number(s.startTime.slice(0, 2))).filter((h) => !Number.isNaN(h));
  const from = Math.min(DEFAULT_FROM, ...hours);
  const to = Math.max(DEFAULT_TO, ...hours);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return DAY_PREFIX.map((prefix, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateKey = toDateKey(d);
    // 이 날짜의 빈자리를 30분 칸 번호(분/30)로 모은다. 10:20 같은 시각은 10:00 칸에 들어간다.
    const openHalves = new Set(
      slots
        .filter((s) => s.date === dateKey)
        .map((s) => {
          const [h, m] = s.startTime.split(':').map(Number);
          return h * 2 + (m >= 30 ? 1 : 0);
        }),
    );

    const cells: HourCell[] = [];
    for (let h = from; h <= to; h++) {
      const state = (half: 0 | 1): HalfState => {
        // 오늘만 "지난 시간"이 있다. 칸이 끝난 시각이 지금 이전이면 지난 칸.
        if (i === 0 && h * 60 + half * 30 + 30 <= nowMin) return 'past';
        return openHalves.has(h * 2 + half) ? 'open' : 'closed';
      };
      cells.push({ hour: h, halves: [state(0), state(1)] });
    }

    return {
      key: dateKey,
      label: `${prefix} (${WEEKDAYS[d.getDay()]})`,
      date: `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`,
      cells,
      hasOpen: cells.some((c) => c.halves.includes('open')),
    };
  });
}

// 메뉴 가격 표기. 이상한 값은 숫자 대신 빈칸으로 둔다(메뉴명은 그대로 보인다):
//  - 0원: 대개 "쿠폰 사용 시 …" 같은 안내 문구 행이다
//  - 100만원 초과: 스크래퍼가 가격 범위 "60,000~90,000"을 한 숫자로 이어붙인 값
//    (예: 6,000,090,000원). 마사지 메뉴 8.5%·헤어 4.1%가 이 상태였다 — 스크래퍼 수정 전 방어.
const MAX_SANE_PRICE = 1_000_000;
function priceText(price: number | null): string {
  if (price == null || price <= 0 || price > MAX_SANE_PRICE) return '';
  return `${price.toLocaleString()}원`;
}

// 인스타 주소 → "@계정". 주소 모양이 달라도(끝 슬래시·쿼리) 계정 이름만 뽑는다.
function instagramOf(routes: ReservationRoute[]): ShopDetailView['instagram'] {
  const r = routes.find((x) => x.type === 'instagram');
  if (!r) return null;
  const handle = r.value.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').split(/[/?#]/)[0];
  return handle ? { handle: `@${handle}`, url: r.value } : null;
}

export function toShopDetailView(
  shop: ShopDetail,
  slots: ShopSlot[],
  myLocation?: { lat: number; lng: number } | null,
  now: Date = new Date(),
): ShopDetailView {
  // 웹과 동일: bizId(네이버 예약 ID)가 있는데 reservationRoutes에 naver가 없으면 네이버 예약
  // 링크를 조립해 최우선으로 넣는다. 백엔드 /shops/:id는 이 조립을 안 해줘 앱만 "톡톡으로 문의"로
  // 뜨던 불일치(웹 api-shop-repository와 동일 로직). bizType 미제공이라 웹처럼 기본 13.
  const rawRoutes = shop.reservationRoutes ?? [];
  const routes: ReservationRoute[] =
    shop.bizId && !rawRoutes.some((r) => r.type === 'naver')
      ? [
          {
            type: 'naver' as const,
            label: '네이버 예약',
            value: `https://m.booking.naver.com/booking/13/bizes/${shop.bizId}`,
          },
          ...rawRoutes,
        ]
      : rawRoutes;

  return {
    id: shop.id,
    name: shop.name,
    category: shop.categories[0] ? `${shop.categories[0]}샵` : '',
    locationLabel: locationLabelOf(shop, myLocation),
    rating: shop.rating ?? null,
    hours: toHoursView(shop.businessHours, now),
    reviewCount: shop.reviewCount,
    photos: shop.photos,
    eventDesc: shop.eventDesc,
    address: shop.roadAddress,
    todayOpen: shop.todayOpen,
    phone: shop.phone,
    instagram: instagramOf(routes),
    introduction: shop.introduction?.trim() || null,
    // 가격 없는 메뉴는 이름만(리더선 유지).
    menus: shop.menus.map((m) => ({ name: m.name, price: priceText(m.price) })),
    timeline: buildTimeline(slots, now),
    reviews: shop.reviews.map((r) => ({ text: r.body, tags: r.keywords, date: r.visited ?? undefined })),
    // 오른쪽 버튼은 온라인 예약 수단만. 인스타·전화는 왼쪽 버튼이 맡는다.
    bookingRoute:
      routes.find((r) => r.type === 'naver') ??
      routes.find((r) => r.type === 'kakao' || r.type === 'talktalk') ??
      null,
  };
}
