import { apiFetch } from '@/shared/api/client';
import type { ShopDetail, ShopListParams, ShopListResponse } from './shops.types';

// 배열은 콤마 구분, default/빈값은 생략. 서버는 콤마로 split 한다.
function buildShopQuery(params: ShopListParams): string {
  const sp = new URLSearchParams();
  if (params.categories?.length) sp.set('categories', params.categories.join(','));
  if (params.districts?.length) sp.set('districts', params.districts.join(','));
  if (params.price_tiers?.length) sp.set('price_tiers', params.price_tiers.join(','));
  if (params.sort && params.sort !== 'default') sp.set('sort', params.sort);
  if (params.has_event) sp.set('has_event', 'true');
  if (params.has_slot) sp.set('has_slot', 'true');
  sp.set('page', String(params.page ?? 1));
  sp.set('limit', String(params.limit ?? 100)); // bounds 미지원이라 1차는 넉넉히 받아 클라에서 핀
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
