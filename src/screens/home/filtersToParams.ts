import type { SlotSearchParams } from '@/shared/domain/reservation/reservation.types';
import type {
  ShopCategory,
  ShopListParams,
  ShopPriceTier,
} from '@/shared/domain/shops/shops.types';
import { dateKeyFromToday } from '@/shared/lib/date';
import type { DateKey, HomeFilterState } from './useHomeFilterStore';

// 백엔드 categories 허용 8종 (syakBE Shop.ts와 동일 — 시술분야 칩과 1:1).
const CATEGORY_WHITELIST: ShopCategory[] = [
  '네일',
  '헤어',
  '왁싱',
  '반영구',
  '속눈썹',
  '마사지',
  '피부',
  '태닝',
];

const DATE_OFFSET: Record<DateKey, number> = { today: 0, tomorrow: 1, day_after: 2 };

// 필터 store 스냅샷 → GET /shops 쿼리 파라미터.
// 세부 services는 백엔드 미지원(전달 안 함). 시간(times)은 /slots/search 교집합(toSlotSearchParams)으로 처리.
type FilterSnapshot = Pick<
  HomeFilterState,
  'search' | 'sort' | 'regions' | 'price' | 'date' | 'times' | 'serviceFields' | 'toggles'
>;

// 시간만 선택하고 날짜가 없으면 '오늘'로 간주 (/slots/search는 dates 필수).
function resolvedDateKey(s: Pick<FilterSnapshot, 'date' | 'times'>): DateKey | null {
  return s.date ?? (s.times.length ? 'today' : null);
}

export function filtersToParams(s: FilterSnapshot): ShopListParams {
  const categories = s.serviceFields.filter((f): f is ShopCategory =>
    (CATEGORY_WHITELIST as string[]).includes(f),
  );

  const params: ShopListParams = {}; // page/limit은 useShops(useInfiniteQuery)와 api 기본값이 관리
  const q = s.search.trim();
  if (q) params.q = q;
  if (s.sort !== 'default') params.sort = s.sort;
  if (categories.length) params.categories = categories;
  if (s.regions.length) params.districts = s.regions;
  if (s.price !== 'all') params.price_tiers = [`${s.price}만원대` as ShopPriceTier];
  if (s.toggles.discount) params.has_event = true;
  // "당일 예약"·"예약 가능" 둘 다 오늘 슬롯 유무(has_slot)로 매핑 — 백엔드에 구분 파라미터 없음.
  if (s.toggles.sameDay || s.toggles.available) params.has_slot = true;
  // 날짜 필터: 해당 날짜에 슬롯 있는 샵만 (시간 조건은 slots/search 교집합이 추가로 좁힘).
  const dateKey = resolvedDateKey(s);
  if (dateKey) params.slot_date = dateKeyFromToday(DATE_OFFSET[dateKey]);
  return params;
}

// 시간 필터용 GET /slots/search 파라미터. 시간 미선택이면 null(호출 불필요 — 날짜만은 slot_date로 충분).
export function toSlotSearchParams(
  s: Pick<FilterSnapshot, 'date' | 'times' | 'regions'>,
): SlotSearchParams | null {
  if (!s.times.length) return null;
  const dateKey = resolvedDateKey(s);
  if (!dateKey) return null;
  return {
    dates: [dateKeyFromToday(DATE_OFFSET[dateKey])],
    // 칩 라벨 '9:00' → 서버 형식 'HH:MM'
    times: s.times.map((t) => (t.length === 4 ? `0${t}` : t)),
    ...(s.regions.length ? { districts: s.regions } : {}),
  };
}
