import type { ShopListItem, ShopPinRow } from '@/shared/domain/shops/shops.types';
import { formatDistrict } from '@/shared/lib/region';

// 지도 마커 종류(=핀 PNG). assets/icons/pin-{kind}.png와 직결.
//  default(분홍 상점) = 일반 샵 / discount(노랑 %) = 할인·이벤트 / reservable(파랑 알람시계) = 예약 가능
export type MarkerKind = 'default' | 'discount' | 'reservable';

// 홈 상단 토글 필터 상태. 토글이 켜져 있으면 목록 자체가 그 조건으로 걸러진 결과라
// 핀도 한 종류로 통일한다 — "할인·이벤트"면 지도에 노란 핀만, "당일 예약"이면 파란 핀만.
export type MarkerToggles = { sameDay: boolean; discount: boolean; available: boolean };

// 핀 종류 결정. 토글이 켜진 동안은 그 토글의 색으로 고정하고, 아무 토글도 없을 때만
// 샵 속성(이벤트 유무)으로 고른다. 둘 다 켜면 더 눈에 띄는 할인(노랑)을 우선한다.
export function markerKindOf(hasEvent: boolean, toggles?: MarkerToggles): MarkerKind {
  if (toggles?.discount) return 'discount';
  if (toggles?.sameDay || toggles?.available) return 'reservable';
  return hasEvent ? 'discount' : 'default';
}

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

export function toShopCardView(
  item: ShopListItem,
  favoriteIds: Set<string>,
  toggles?: MarkerToggles,
): ShopCardView {
  const badges: string[] = [];
  if (item.eventDesc) badges.push(item.eventDesc); // 이벤트 설명(있으면 첫 배지)
  if (item.priceTier) badges.push(item.priceTier); // 가격대 "2만원대"

  const markerKind = markerKindOf(item.eventDesc != null, toggles);

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

// 핀 종류 규칙은 카드와 동일(markerKindOf).
export function toPinView(row: ShopPinRow, toggles?: MarkerToggles): MapPinView | null {
  if (row.lat == null || row.lng == null) return null;
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    markerKind: markerKindOf(row.event_desc != null, toggles),
  };
}
