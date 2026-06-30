import type { ShopListItem } from '@/shared/domain/shops/shops.types';

// 지도 마커 종류(=핀 PNG). assets/icons/pin-{kind}.png와 직결. 우선순위 partner→discount→reservable.
export type MarkerKind = 'partner' | 'discount' | 'reservable';

// 화면(카드·마커)이 쓰는 뷰모델. 백엔드 ShopListItem을 어댑터로 변환한다.
export type ShopCardView = {
  id: string;
  name: string;
  reviewCount: number | null; // 목록 응답 미제공 → null(카드에서 숨김)
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
    reviewCount: null,
    address: [item.region, item.district].filter(Boolean).join(' '),
    badges,
    markerKind,
    favorite: favoriteIds.has(item.id),
    lat: item.lat,
    lng: item.lng,
    photo: item.photos[0] ?? null,
  };
}
