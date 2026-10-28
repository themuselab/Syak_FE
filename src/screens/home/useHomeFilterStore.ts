import { useEffect, useState } from 'react';
import { create } from 'zustand';

// 홈 필터 상태 (순수 클라 상태 → Zustand). 칩바 활성 표시 + 목록 필터링 구동.
// 디자이너 시안 2026-10-15 기준으로 재구성: 상단 칩 하나 고르기 + 바텀시트 통합 필터 패널.

// 정렬 — 필터 패널 "정렬" 섹션과 1:1. 'default' = 관련도순.
export type SortKey = 'default' | 'review' | 'price_asc';
export type DateKey = 'today' | 'tomorrow' | 'day_after';
// 통합 필터 패널을 어떤 칩으로 열었는지. 패널 내용은 같고 열린 계기만 다르다.
export type FilterKey = 'sort' | 'price' | 'time';

// 지도 모드 토글. 둘은 상호 배타(라디오) — 동시에 켜지지 않는다.
//  둘 다 꺼짐 = 기본(전체 샵, 분홍 핀) / sameDay = 당일 예약(파란 핀) / discount = 할인·이벤트(노란 핀)
export type ToggleKey = 'sameDay' | 'discount';

// 홈 상단 칩에서 고른 것 하나. 고르면 칩 줄이 사라지고 검색바가 "< 네일 ✕" 헤더로 바뀐다(시안).
export type Picked = { kind: 'category'; label: string } | { kind: 'partner' } | null;

// 가격 슬라이더는 만원 단위. PRICE_MAX는 "10만원 이상"을 뜻해 상한을 걸지 않는다.
export const PRICE_MAX = 10;
export type PriceRange = [number, number];
const FULL_PRICE: PriceRange = [0, PRICE_MAX];

export type HomeFilterState = {
  activeFilter: FilterKey | null;
  setActiveFilter: (f: FilterKey | null) => void;

  search: string;
  picked: Picked;
  sort: SortKey;
  priceRange: PriceRange;
  date: DateKey | null;
  times: string[];
  toggles: Record<ToggleKey, boolean>;

  setSearch: (v: string) => void;
  setPicked: (v: Picked) => void;
  setSort: (v: SortKey) => void;
  setPriceRange: (v: PriceRange) => void;
  setDate: (v: DateKey | null) => void;
  setTimes: (v: string[]) => void;
  toggle: (key: ToggleKey) => void;
  reset: () => void;
};

const initial = {
  search: '',
  picked: null as Picked,
  sort: 'default' as SortKey,
  priceRange: FULL_PRICE,
  date: null as DateKey | null,
  times: [] as string[],
  toggles: { sameDay: false, discount: false },
};

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  ...initial,
  activeFilter: null,
  setActiveFilter: (f) => set({ activeFilter: f }),
  setSearch: (v) => set({ search: v }),
  setPicked: (v) => set({ picked: v }),
  setSort: (v) => set({ sort: v }),
  setPriceRange: (v) => set({ priceRange: v }),
  setDate: (v) => set({ date: v }),
  setTimes: (v) => set({ times: v }),
  // 누른 것만 켜고 나머지는 끈다(상호 배타). 켜져 있는 걸 다시 누르면 꺼져 기본 상태로 돌아간다.
  toggle: (key) =>
    set((s) => ({ toggles: { sameDay: false, discount: false, [key]: !s.toggles[key] } })),
  reset: () => set({ ...initial, toggles: { sameDay: false, discount: false } }),
}));

/** 가격 범위가 전체(필터 없음)인지 */
export function isFullPrice([min, max]: PriceRange): boolean {
  return min <= 0 && max >= PRICE_MAX;
}

// 검색어를 delay(ms) 동안 입력이 멈춘 뒤에만 반영해 돌려준다(서버 요청 폭주 방지).
// search를 직접 구독하면 타이핑마다 홈 전체(지도·목록 카드)가 다시 그려진다 — 스토어를 직접 구독하고
// 디바운스된 값만 state로 올려, 이 훅을 쓰는 컴포넌트는 입력이 멈췄을 때만 리렌더된다.
export function useDebouncedSearch(delay = 300): string {
  const [value, setValue] = useState(() => useHomeFilterStore.getState().search);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const unsub = useHomeFilterStore.subscribe((s, prev) => {
      if (s.search === prev.search) return;
      clearTimeout(t);
      t = setTimeout(() => setValue(s.search), delay);
    });
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [delay]);
  return value;
}
