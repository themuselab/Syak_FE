import type { ShopListItem, ShopPinRow } from '@/shared/domain/shops/shops.types';
import { formatDistrict } from '@/shared/lib/region';

// 지도 마커 종류(=핀 PNG). assets/icons/pin-{kind}.png와 직결. 우선순위 partner→discount→reservable.
export type MarkerKind = 'partner' | 'discount' | 'reservable';

// 화면(카드·마커)이 쓰는 뷰모델. 백엔드 ShopListItem을 어댑터로 변환한다.
export type ShopCardView = {
  id: string;
  name: string;
  reviewCount: number | null; // null이면 카드에서 숨김
  address: string;
  badges: string[];
  markerKind: MarkerKind;
  favorite: boolean;
  lat: number | null;
  lng: number | null;
  photo: string | null;
};

export function toShopCardView(item: ShopListItem, favoriteIds: Set<string>): ShopCardView {
  const badges: string[] = [];
  if (item.eventDesc) badges.push(item.eventDesc); // 이벤트 설명(있으면 첫 배지)
  if (item.priceTier) badges.push(item.priceTier); // 가격대 "2만원대"

  const markerKind: MarkerKind = item.isPartner
    ? 'partner'
    : item.eventDesc
      ? 'discount'
      : 'reservable';

  return {
    id: item.id,
    name: item.name,
    reviewCount: item.reviewCount,
    // region은 백엔드가 항상 "서울"로 보내는 부정확한 값이라 미사용 — district 기반 표기.
    address: formatDistrict(item.district),
    badges,
    markerKind,
    favorite: favoriteIds.has(item.id),
    lat: item.lat,
    lng: item.lng,
    photo: item.photos[0] ?? null,
  };
}

// 지도 마커 뷰모델(핀 전용, 경량). /web/shops/pins 행 → 좌표 + 핀 종류.
export type MapPinView = { id: string; lat: number; lng: number; markerKind: MarkerKind };

// 핀 종류 우선순위는 카드와 동일: partner → discount(이벤트) → reservable.
export function toPinView(row: ShopPinRow): MapPinView | null {
  if (row.lat == null || row.lng == null) return null;
  const markerKind: MarkerKind = row.is_partner ? 'partner' : row.event_desc ? 'discount' : 'reservable';
  return { id: row.id, lat: row.lat, lng: row.lng, markerKind };
}
