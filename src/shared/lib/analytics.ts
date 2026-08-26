// GA4 계측 — Firebase Analytics(네이티브 모듈)로 이벤트를 GA4 속성(앱 스트림)에 전송.
// 카카오/네이버/FCM과 동일한 dynamic import 가드: web·Expo Go·google-services 미포함
// 빌드에선 import가 실패하고 catch로 조용히 통과(기존 화면 무영향, 앱 안 깨짐).
//
// 이벤트 이름·파라미터는 소비자 웹(gtag)과 맞춘다 → GA4에서 웹+앱 통합 퍼널.
//   shop_view(shop_id) · reserve_click(shop_id) · screen_view · map_pin_click 등.
// 전제: Firebase 프로젝트가 "Syak" GA4 속성에 연결돼 있어야 웹과 같은 속성에 쌓임(콘솔 설정).

// 타입 전용 import는 번들에서 지워져 web에서도 안전.
type AnalyticsMod = typeof import('@react-native-firebase/analytics');

let modPromise: Promise<AnalyticsMod | null> | null = null;
function load(): Promise<AnalyticsMod | null> {
  if (modPromise === null) {
    modPromise = import('@react-native-firebase/analytics').catch((e) => {
      console.warn('[analytics] firebase analytics 미사용(가드 통과)', e?.message ?? e);
      return null;
    });
  }
  return modPromise;
}

// GA4 제약: 이벤트/파라미터명 snake_case, undefined 값은 제거.
function clean(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) out[k] = v;
  return out;
}

async function logEvent(name: string, params?: Record<string, unknown>): Promise<void> {
  const m = await load();
  if (!m) return;
  try {
    await m.logEvent(m.getAnalytics(), name, clean(params) as never);
  } catch (e) {
    console.warn('[analytics] logEvent 실패', name, (e as Error)?.message);
  }
}

async function logScreen(screen: string): Promise<void> {
  const m = await load();
  if (!m) return;
  try {
    await m.logScreenView(m.getAnalytics(), { screen_name: screen, screen_class: screen });
  } catch {
    /* 무시 */
  }
}

/** 소비자 웹과 맞춘 이벤트 헬퍼 (GA4 통합 퍼널). 전부 fire-and-forget. */
export const track = {
  screen: (name: string) => void logScreen(name),
  shopView: (shopId: string, shopName?: string) =>
    void logEvent('shop_view', { shop_id: shopId, shop_name: shopName }),
  reserveClick: (shopId: string, method?: string) =>
    void logEvent('reserve_click', { shop_id: shopId, method }),
  mapPinClick: (shopId: string) => void logEvent('map_pin_click', { shop_id: shopId }),
  regionSelect: (region: string) => void logEvent('region_select', { region }),
  filterApply: (summary?: string) => void logEvent('filter_apply', { summary }),
  event: (name: string, params?: Record<string, unknown>) => void logEvent(name, params),
};
