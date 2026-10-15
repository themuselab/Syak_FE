import { create } from 'zustand';

// 내 위치(GPS 좌표) — 앱 전역 상태.
// 홈 지도 점, 목록 카드 거리("320m 전농동"), 샵 상세 거리가 같은 값을 쓴다.
// 예전엔 홈 화면 useState에만 있어서 상세 화면은 거리를 알 수 없었다.
// 위치 미동의면 null — 이때 화면들은 거리 없이 동네만 보여준다(디자이너 코멘트).
type MyLocationState = {
  coords: { lat: number; lng: number } | null;
  setCoords: (c: { lat: number; lng: number } | null) => void;
};

export const useMyLocationStore = create<MyLocationState>((set) => ({
  coords: null,
  setCoords: (coords) => set({ coords }),
}));
