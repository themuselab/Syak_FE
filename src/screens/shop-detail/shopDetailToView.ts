import type { ShopSlot } from '@/shared/domain/reservation/reservation.types';
import type { ReservationRoute, ShopDetail } from '@/shared/domain/shops/shops.types';
import { openTimesOn, threeDays } from '@/shared/lib/slotTimes';

import { type HoursView, toHoursView } from './businessHours';
import { locationLabelOf } from '../home/shopToView';

// 상세 화면 뷰모델. 백엔드 ShopDetail + 슬롯(3일치)을 각 섹션 컴포넌트가 쓰는 형태로 변환한다.
// 디자인: 디자이너 시안 2026-10-15 "샵 상세" / "샵 상세-빈자리 마감".

// "예약 가능 시간" 섹션의 하루(시안 2026-10-29): 탭 "오늘 화" + 빈자리 시각 목록.
export type AvailabilityDay = {
  key: string; // 'YYYY-MM-DD'
  prefix: string; // "오늘"
  weekday: string; // "화"
  times: string[]; // 빈자리 시각(정렬). 오늘은 지난 시각 제외. 비면 "예약이 모두 마감되었어요"
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
  availability: AvailabilityDay[];
  reviews: ReviewItem[];
  // 하단 바. 오른쪽 = 네이버 예약(없으면 카카오·톡톡 등 다른 온라인 예약), 왼쪽 = 인스타 → 전화.
  bookingRoute: ReservationRoute | null;
};

// 슬롯(flat) → 오늘·내일·모레 빈자리 시각.
function buildAvailability(slots: ShopSlot[], now: Date): AvailabilityDay[] {
  return threeDays(now).map((d) => ({
    key: d.key,
    prefix: d.prefix,
    weekday: d.weekday,
    times: openTimesOn(slots, d.key, now),
  }));
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
    availability: buildAvailability(slots, now),
    reviews: shop.reviews.map((r) => ({ text: r.body, tags: r.keywords, date: r.visited ?? undefined })),
    // 오른쪽 버튼은 온라인 예약 수단만. 인스타·전화는 왼쪽 버튼이 맡는다.
    bookingRoute:
      routes.find((r) => r.type === 'naver') ??
      routes.find((r) => r.type === 'kakao' || r.type === 'talktalk') ??
      null,
  };
}
