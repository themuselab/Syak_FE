import { create } from 'zustand';

// 홈 필터 상태 (순수 클라 상태 → Zustand). 칩바 활성 표시 + 목록 필터링 구동.
export type SortKey = 'default' | 'price_asc' | 'price_desc' | 'partner';
export type PriceKey = 'all' | '1' | '2' | '3';
export type DateKey = 'today' | 'tomorrow' | 'day_after';
// 바텀시트에서 열려있는 필터 (null = 매장 목록). 시트 내용 전환에 사용.
export type FilterKey = 'sort' | 'region' | 'price' | 'time' | 'service';

type ToggleKey = 'sameDay' | 'discount' | 'available';

type HomeFilterState = {
  activeFilter: FilterKey | null;
  setActiveFilter: (f: FilterKey | null) => void;

  search: string;
  sort: SortKey;
  regions: string[];
  price: PriceKey;
  date: DateKey | null;
  times: string[];
  serviceFields: string[];
  services: string[];
  toggles: Record<ToggleKey, boolean>;

  setSearch: (v: string) => void;
  setSort: (v: SortKey) => void;
  setRegions: (v: string[]) => void;
  setPrice: (v: PriceKey) => void;
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
  price: 'all' as PriceKey,
  date: null as DateKey | null,
  times: [] as string[],
  serviceFields: [] as string[],
  services: [] as string[],
  toggles: { sameDay: false, discount: false, available: false },
};

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  ...initial,
  activeFilter: null,
  setActiveFilter: (f) => set({ activeFilter: f }),
  setSearch: (v) => set({ search: v }),
  setSort: (v) => set({ sort: v }),
  setRegions: (v) => set({ regions: v }),
  setPrice: (v) => set({ price: v }),
  setDate: (v) => set({ date: v }),
  setTimes: (v) => set({ times: v }),
  setServiceFields: (v) => set({ serviceFields: v }),
  setServices: (v) => set({ services: v }),
  toggle: (key) => set((s) => ({ toggles: { ...s.toggles, [key]: !s.toggles[key] } })),
  reset: () => set({ ...initial, toggles: { sameDay: false, discount: false, available: false } }),
}));
