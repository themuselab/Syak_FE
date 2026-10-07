import { create } from 'zustand';

// 홈 필터 상태 (순수 클라 상태 → Zustand). 칩바 활성 표시 + 목록 필터링 구동.
export type SortKey = 'default' | 'price_asc' | 'price_desc' | 'partner';
// 가격대는 복수 선택(QA #14 — BE price_tiers 콤마 구분 지원). 빈 배열 = 전체.
export type PriceKey = '1' | '2' | '3';
export type DateKey = 'today' | 'tomorrow' | 'day_after';
// 바텀시트에서 열려있는 필터 (null = 매장 목록). 시트 내용 전환에 사용.
export type FilterKey = 'sort' | 'region' | 'price' | 'time' | 'service';

// 지도 모드 토글. 둘은 상호 배타(라디오) — 동시에 켜지지 않는다.
//  둘 다 꺼짐 = 기본(전체 샵, 분홍 핀) / sameDay = 당일 예약(파란 핀) / discount = 이벤트(노란 핀)
export type ToggleKey = 'sameDay' | 'discount';

export type HomeFilterState = {
  activeFilter: FilterKey | null;
  setActiveFilter: (f: FilterKey | null) => void;

  search: string;
  sort: SortKey;
  regions: string[];
  prices: PriceKey[];
  date: DateKey | null;
  times: string[];
  serviceFields: string[];
  services: string[];
  toggles: Record<ToggleKey, boolean>;

  setSearch: (v: string) => void;
  setSort: (v: SortKey) => void;
  setRegions: (v: string[]) => void;
  setPrices: (v: PriceKey[]) => void;
  setDate: (v: DateKey | null) => void;
  setTimes: (v: string[]) => void;
  setServiceFields: (v: string[]) => void;
  setServices: (v: string[]) => void;
  toggle: (key: ToggleKey) => void;
  reset: () => void;
};

const initial = {
  search: '',
  sort: 'default' as SortKey,
  regions: [] as string[],
  prices: [] as PriceKey[],
  date: null as DateKey | null,
  times: [] as string[],
  serviceFields: [] as string[],
  services: [] as string[],
  toggles: { sameDay: false, discount: false },
};

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  ...initial,
  activeFilter: null,
  setActiveFilter: (f) => set({ activeFilter: f }),
  setSearch: (v) => set({ search: v }),
  setSort: (v) => set({ sort: v }),
  setRegions: (v) => set({ regions: v }),
  setPrices: (v) => set({ prices: v }),
  setDate: (v) => set({ date: v }),
  setTimes: (v) => set({ times: v }),
  setServiceFields: (v) => set({ serviceFields: v }),
  setServices: (v) => set({ services: v }),
  // 누른 것만 켜고 나머지는 끈다(상호 배타). 켜져 있는 걸 다시 누르면 꺼져 기본 상태로 돌아간다.
  toggle: (key) =>
    set((s) => ({ toggles: { sameDay: false, discount: false, [key]: !s.toggles[key] } })),
  reset: () => set({ ...initial, toggles: { sameDay: false, discount: false } }),
}));
