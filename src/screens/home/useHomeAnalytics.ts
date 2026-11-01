import { useEffect } from 'react';

import type { ShopListItem } from '@/shared/domain/shops/shops.types';
import { track } from '@/shared/lib/analytics';

import { isFullPrice, type HomeFilterState, type Picked } from './useHomeFilterStore';

// 홈 목록 계측(GA4) — shop_list_view · search · search_no_result · filter_apply. docs/analytics.md
//
// 중복 제거: 마지막으로 보낸 조합을 모듈 변수에 둔다. 홈이 다시 마운트돼도(상세 갔다 오기) 같은 조합이면
// 다시 보내지 않고, 조합이 바뀌면(카테고리·필터·구·검색어) 그때 1회. 스크롤·리렌더·다음 페이지 로드는
// 조합을 바꾸지 않으므로 이벤트가 나가지 않는다. 결과가 자리 잡을 때까지 SETTLE_MS 기다린다
// (슬라이더 드래그·한 글자씩 입력 중의 중간 상태는 보내지 않음).
const SETTLE_MS = 800;
let lastListKey: string | null = null;
let lastSearchKey: string | null = null;
let lastFilterSummary = 'none';

type FilterSnapshot = Pick<HomeFilterState, 'sort' | 'priceRange' | 'date' | 'times' | 'toggles'>;

/** 상단 칩 선택 → category 파라미터. 시술 분야 라벨 / partner / all */
function categoryOf(picked: Picked): string {
  if (picked?.kind === 'category') return picked.label;
  if (picked?.kind === 'partner') return 'partner';
  return 'all';
}

/** 필터 상태 요약(웹 filter_apply의 source와 같은 "a,b,c" 형식). 아무것도 없으면 'none' */
export function filterSummaryOf(s: FilterSnapshot): string {
  const parts: string[] = [];
  if (s.sort !== 'default') parts.push(`정렬:${s.sort}`);
  if (!isFullPrice(s.priceRange)) parts.push(`가격:${s.priceRange[0]}-${s.priceRange[1]}`);
  if (s.date || s.times.length) parts.push(`날짜:${s.date ?? 'today'}`);
  if (s.times.length) parts.push(`시간:${s.times.join('|')}`);
  if (s.toggles.sameDay) parts.push('당일예약');
  if (s.toggles.discount) parts.push('할인');
  return parts.join(',') || 'none';
}

/** 결과에서 가장 많이 나온 구(district) — 사용자가 보고 있는 지역. 결과가 없으면 undefined */
function dominantDistrict(items: ShopListItem[]): string | undefined {
  const count = new Map<string, number>();
  for (const it of items) if (it.district) count.set(it.district, (count.get(it.district) ?? 0) + 1);
  let best: string | undefined;
  let max = 0;
  count.forEach((n, d) => {
    if (n > max) [best, max] = [d, n];
  });
  return best;
}

type Args = {
  search: string; // 디바운스된 검색어
  picked: Picked;
  filters: FilterSnapshot;
  firstPage: ShopListItem[]; // 첫 페이지 원본(구 판정용)
  resultCount: number; // 화면에 보이는 결과 수(시간 필터 교집합 후)
  ready: boolean; // 지금 조건의 응답이 도착했는지(이전 결과 placeholder·로딩·에러면 false)
};

export function useHomeAnalytics({ search, picked, filters, firstPage, resultCount, ready }: Args) {
  const category = categoryOf(picked);
  const filterSummary = filterSummaryOf(filters);
  const term = search.trim().toLowerCase();
  const region = ready ? dominantDistrict(firstPage) : undefined;

  // shop_list_view — 검색어 없는 홈 목록이 새 조합(category·region·filter)으로 보일 때 1회.
  useEffect(() => {
    if (!ready || term) return;
    const key = `${category}|${region ?? ''}|${filterSummary}`;
    if (key === lastListKey) return;
    const t = setTimeout(() => {
      lastListKey = key;
      track('shop_list_view', { category, region, filter: filterSummary, result_count: resultCount });
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [ready, term, category, region, filterSummary, resultCount]);

  // search / search_no_result — 비어 있지 않은 검색어의 결과가 도착했을 때 (검색어·카테고리) 조합당 1회.
  // 매장·동네·시술 이름을 찾는 검색창이라 원문을 보내되, 소문자·trim 후 30자로 자른다(장문 개인정보 방지).
  useEffect(() => {
    if (!ready || !term) return;
    const key = `${term}|${category}`;
    if (key === lastSearchKey) return;
    const t = setTimeout(() => {
      lastSearchKey = key;
      const params = {
        search_term: term.slice(0, 30),
        search_term_length: term.length,
        has_category: category !== 'all',
        category,
        region,
        result_count: resultCount,
      };
      track('search', params);
      if (resultCount === 0) track('search_no_result', params);
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [ready, term, category, region, resultCount]);

  // filter_apply — 필터(정렬·가격·예약시간·당일예약/할인 토글)가 새 조합으로 자리 잡으면 1회.
  // 앱 필터는 고르는 즉시 반영돼("적용하기"는 닫기만) 버튼 대신 상태 변화로 잡는다. 전부 해제('none')는 보내지 않는다.
  useEffect(() => {
    if (filterSummary === lastFilterSummary) return;
    const t = setTimeout(() => {
      lastFilterSummary = filterSummary;
      if (filterSummary !== 'none') track('filter_apply', { source: filterSummary, filter: filterSummary });
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [filterSummary]);
}
