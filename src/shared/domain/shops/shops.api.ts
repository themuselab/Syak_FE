import { apiFetch } from '@/shared/api/client';
import type {
  MapBounds,
  ShopDetail,
  ShopListParams,
  ShopListResponse,
  ShopPinRow,
} from './shops.types';

// 배열은 콤마 구분, default/빈값은 생략. 서버는 콤마로 split 한다.
function buildShopQuery(params: ShopListParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.categories?.length) sp.set('categories', params.categories.join(','));
  if (params.districts?.length) sp.set('districts', params.districts.join(','));
  if (params.price_tiers?.length) sp.set('price_tiers', params.price_tiers.join(','));
  if (params.sort && params.sort !== 'default') sp.set('sort', params.sort);
  if (params.has_event) sp.set('has_event', 'true');
  if (params.has_slot) sp.set('has_slot', 'true');
  if (params.slot_date) sp.set('slot_date', params.slot_date);
  if (params.lat != null && params.lng != null) {
    sp.set('lat', String(params.lat));
    sp.set('lng', String(params.lng));
  }
  if (
    params.swLat != null && params.swLng != null &&
    params.neLat != null && params.neLng != null
  ) {
    sp.set('swLat', String(params.swLat));
    sp.set('swLng', String(params.swLng));
    sp.set('neLat', String(params.neLat));
    sp.set('neLng', String(params.neLng));
  }
  sp.set('page', String(params.page ?? 1));
  sp.set('limit', String(params.limit ?? 20)); // 무한스크롤 기본 페이지 크기 20 (서버 최대 100)
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// GET /shops — 샵 목록 (인증 불필요, 비회원도 호출).
export function getShops(params: ShopListParams = {}) {
  return apiFetch<ShopListResponse>(`/shops${buildShopQuery(params)}`);
}

// GET /shops/:id — 샵 상세.
export function getShop(shopId: string) {
  return apiFetch<ShopDetail>(`/shops/${shopId}`);
}

// GET /web/shops/pins — 지도 영역 안 모든 샵의 핀(반경 아님, 웹과 동일). 인증 불필요.
export function getShopPins(b: MapBounds) {
  const sp = new URLSearchParams({
    swLat: String(b.swLat),
    swLng: String(b.swLng),
    neLat: String(b.neLat),
    neLng: String(b.neLng),
  });
  return apiFetch<ShopPinRow[]>(`/web/shops/pins?${sp.toString()}`);
}
