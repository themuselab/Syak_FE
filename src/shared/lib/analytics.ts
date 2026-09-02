// GA4 계측 — v1에서는 비활성(no-op). Firebase Analytics(@react-native-firebase/analytics)가
// Expo54/RN0.81 iOS에서 빌드 실패해 v1에서는 네이티브 Firebase를 제거했다. 호출부(track.*)는
// 그대로 두되 아무 동작도 하지 않는다. v1.1에서 분석을 재도입할 때 이 파일만 되살리면 된다.
// 이벤트 스펙(웹 gtag와 통일): shop_view · reserve_click · screen_view · map_pin_click 등.

const noop = (..._args: unknown[]): void => {};

/** 소비자 웹과 맞춘 이벤트 헬퍼. v1은 no-op(네이티브 Firebase 제거). */
export const track = {
  screen: (_name: string) => noop(),
  shopView: (_shopId: string, _shopName?: string) => noop(),
  reserveClick: (_shopId: string, _method?: string) => noop(),
  mapPinClick: (_shopId: string) => noop(),
  regionSelect: (_region: string) => noop(),
  filterApply: (_summary?: string) => noop(),
  event: (_name: string, _params?: Record<string, unknown>) => noop(),
};
