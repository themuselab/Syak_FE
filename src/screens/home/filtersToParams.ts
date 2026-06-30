import type {
  ShopCategory,
  ShopListParams,
  ShopPriceTier,
} from '@/shared/domain/shops/shops.types';
import type { HomeFilterState } from './useHomeFilterStore';

// 백엔드 categories 허용값 (시술분야 8종 중 백엔드가 받는 4종만 통과).
const CATEGORY_WHITELIST: ShopCategory[] = ['헤어', '네일', '왁싱', '반영구'];

// 필터 store 스냅샷 → GET /shops 쿼리 파라미터.
// 백엔드 미지원(date/times/세부 services/이름검색/price_desc)은 여기서 제외하고 클라에서 후처리(HomeScreen).
type FilterSnapshot = Pick<
  HomeFilterState,
  'sort' | 'regions' | 'price' | 'serviceFields' | 'toggles'
>;

export function filtersToParams(s: FilterSnapshot): ShopListParams {
  const categories = s.serviceFields.filter((f): f is ShopCategory =>
    (CATEGORY_WHITELIST as string[]).includes(f),
  );

  const params: ShopListParams = { page: 1, limit: 100 };
  // price_desc는 백엔드에 없음 → 보내지 않고 HomeScreen에서 클라 정렬.
  if (s.sort === 'price_asc' || s.sort === 'partner') params.sort = s.sort;
  if (categories.length) params.categories = categories;
  if (s.regions.length) params.districts = s.regions;
  if (s.price !== 'all') params.price_tiers = [`${s.price}만원대` as ShopPriceTier];
  if (s.toggles.discount) params.has_event = true;
  // "당일 예약"·"예약 가능" 둘 다 오늘 슬롯 유무(has_slot)로 매핑 — 백엔드에 구분 파라미터 없음.
  if (s.toggles.sameDay || s.toggles.available) params.has_slot = true;
  return params;
}
