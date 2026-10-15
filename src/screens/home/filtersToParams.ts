import type { SlotSearchParams } from '@/shared/domain/reservation/reservation.types';
import type { ShopCategory, ShopListParams } from '@/shared/domain/shops/shops.types';
import { dateKeyFromToday } from '@/shared/lib/date';

import { SERVICE_FIELDS } from './serviceFields';
import {
  type DateKey,
  type HomeFilterState,
  isFullPrice,
  PRICE_MAX,
} from './useHomeFilterStore';

const DATE_OFFSET: Record<DateKey, number> = { today: 0, tomorrow: 1, day_after: 2 };
const WON_PER_MANWON = 10_000;

// 필터 store 스냅샷 → GET /shops 쿼리 파라미터.
// 시간(times)은 /slots/search 교집합(toSlotSearchParams)으로 처리한다.
type FilterSnapshot = Pick<
  HomeFilterState,
  'search' | 'picked' | 'sort' | 'priceRange' | 'date' | 'times' | 'toggles'
>;

// 시간만 선택하고 날짜가 없으면 '오늘'로 간주 (/slots/search는 dates 필수).
function resolvedDateKey(s: Pick<FilterSnapshot, 'date' | 'times'>): DateKey | null {
  return s.date ?? (s.times.length ? 'today' : null);
}

export function filtersToParams(s: FilterSnapshot): ShopListParams {
  const params: ShopListParams = {}; // page/limit은 useShops(useInfiniteQuery)와 api 기본값이 관리
  const q = s.search.trim();
  if (q) params.q = q;
  if (s.sort !== 'default') params.sort = s.sort;

  // 상단 칩에서 고른 것: 시술 분야 하나 또는 샥 파트너.
  if (s.picked?.kind === 'category' && (SERVICE_FIELDS as readonly string[]).includes(s.picked.label)) {
    params.categories = [s.picked.label as ShopCategory];
  }
  if (s.picked?.kind === 'partner') params.is_partner = true;

  // 가격 범위(만원 → 원). 상한이 PRICE_MAX면 "N만원 이상"이라 상한을 보내지 않는다.
  if (!isFullPrice(s.priceRange)) {
    const [min, max] = s.priceRange;
    if (min > 0) params.price_min = min * WON_PER_MANWON;
    if (max < PRICE_MAX) params.price_max = max * WON_PER_MANWON;
  }

  if (s.toggles.discount) params.has_event = true;
  // "당일 예약" = 오늘 슬롯 있는 샵(has_slot).
  if (s.toggles.sameDay) params.has_slot = true;
  // 날짜 필터: 해당 날짜에 슬롯 있는 샵만 (시간 조건은 slots/search 교집합이 추가로 좁힘).
  const dateKey = resolvedDateKey(s);
  if (dateKey) params.slot_date = dateKeyFromToday(DATE_OFFSET[dateKey]);
  return params;
}

// 시간 필터용 GET /slots/search 파라미터. 시간 미선택이면 null(호출 불필요 — 날짜만은 slot_date로 충분).
export function toSlotSearchParams(
  s: Pick<FilterSnapshot, 'date' | 'times'>,
): SlotSearchParams | null {
  if (!s.times.length) return null;
  const dateKey = resolvedDateKey(s);
  if (!dateKey) return null;
  return {
    dates: [dateKeyFromToday(DATE_OFFSET[dateKey])],
    // 칩 라벨 '9:00' → 서버 형식 'HH:MM'
    times: s.times.map((t) => (t.length === 4 ? `0${t}` : t)),
  };
}
