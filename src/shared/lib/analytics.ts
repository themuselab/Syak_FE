import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { getDeviceId } from '@/shared/lib/deviceId';
import { inShell, shellInfo } from '@/shell/bridgeClient';
import { createAnalyticsDelivery, installInteractionTracking } from './analyticsDelivery';

const delivery = createAnalyticsDelivery({
  sdkKey: process.env.EXPO_PUBLIC_HACKLE_SDK_KEY,
  getDeviceId,
  gtmId: process.env.EXPO_PUBLIC_GTM_ID,
  transport: process.env.EXPO_PUBLIC_ANALYTICS_TRANSPORT,
});

// GA4 계측 — 웹 빌드(app.themuselab.kr)가 gtag로 보낸다. 앱(iOS/Android)도 그 웹을 웹뷰로 띄우므로
// 같은 코드가 셸 안에서 돌고, `platform` 파라미터로 web/ios/android를 나눈다. 속성은 소비자 웹(www)과
// 같은 G-Q0WLLSMTXM — shop_view·reserve_click·region_select·filter_apply는 웹과 이름을 맞췄다.
// gtag 스니펫은 app/+html.tsx가 정적 HTML head에 심는다. 이벤트 명세: docs/analytics.md
//
// 원칙: 전부 fire-and-forget. gtag가 없거나(광고 차단·네이티브 번들) 무엇이 실패해도 조용히 넘어가고
// 화면 동작에 영향을 주지 않는다. 개인정보(이메일·전화·닉네임·검색 원문 장문)는 보내지 않는다.

type ParamValue = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, ParamValue>;
type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const g = (window as unknown as { gtag?: unknown }).gtag;
  return typeof g === 'function' ? (g as Gtag) : null;
}

function safe(fn: () => void): void {
  try {
    fn();
  } catch {
    // silent — 분석 실패가 화면을 깨뜨리면 안 된다
  }
}

// 이벤트 중복 제거용 ID(GA4/BigQuery에서 같은 event_id면 한 번으로 본다).
// crypto.randomUUID가 없는 구형 웹뷰(iOS 15.4 미만)도 있어 getRandomValues → Math.random 순으로 대체.
function uuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** 'ios' | 'android'(웹뷰 셸 안) 또는 'web'(일반 브라우저) */
export function analyticsPlatform(): 'ios' | 'android' | 'web' {
  return shellInfo()?.platform ?? 'web';
}

// 설치 단위 익명 ID(deviceId.ts, AsyncStorage=웹에선 localStorage). 비동기라 initAnalytics에서 한 번 읽어
// 캐시하고, 읽히기 전 이벤트엔 빠진다. 같은 값을 GA user_property(anonymous_id)로도 심는다.
let anonymousId: string | null = null;

/**
 * 모든 이벤트의 단일 진입점. 공통 파라미터(platform·app_version·anonymous_id·event_id)를 붙여 gtag로 보낸다.
 * undefined/null 파라미터는 뺀다.
 */
function trackCore(name: string, params: AnalyticsParams = {}): void {
  safe(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const info = shellInfo();
    const payload: Record<string, string | number | boolean> = {
      platform: info?.platform ?? 'web',
      event_id: uuid(),
    };
    if (info?.version) payload.app_version = info.version;
    if (anonymousId) payload.anonymous_id = anonymousId;
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') payload[k] = v;
    }
    delivery.send(name, payload);
  });
}

/**
 * GA user_id = 내부 유저 UUID만(이메일·전화·닉네임 금지). null이면 해제(로그아웃).
 * initAnalytics가 auth store를 구독해 자동으로 맞추므로 보통 직접 부를 일은 없다.
 */
let currentUserId: string | null | undefined;
export function setAnalyticsUserId(id: string | null): void {
  if (id === currentUserId) return;
  currentUserId = id;
  delivery.setIdentity(id, anonymousId ?? undefined);
  safe(() => gtag()?.('set', { user_id: id ?? null }));
}

// ── 같은 세션 안 1회 보장(dedupe) ──
const fired = new Set<string>();
/** key가 이번 세션(페이지 로드)에서 처음일 때만 보낸다 */
function trackOnce(key: string, name: string, params?: AnalyticsParams): void {
  if (fired.has(key)) return;
  fired.add(key);
  trackCore(name, params);
}

// ── shop_view 진입 경로(source) ──
// 이동 직전에 "다음에 열릴 샵은 어디서 왔는지"를 적어 두고, shop_view가 같은 샵이면 가져간다.
// URL에 흔적을 남기지 않으려고(화면·공유 링크 불변) 모듈 메모리로 넘긴다. 30초 지나면 버린다.
export type ShopViewSource = 'list' | 'pin' | 'push' | 'favorite' | 'notification' | 'direct';
let pendingSource: { shopId: string; source: ShopViewSource; at: number } | null = null;
const SOURCE_TTL_MS = 30_000;

export function markShopSource(shopId: string, source: ShopViewSource): void {
  trackCore('shop_select', { shop_id: shopId, source });
  pendingSource = { shopId, source, at: Date.now() };
}

function takeShopSource(shopId: string, fallback: ShopViewSource): ShopViewSource {
  const p = pendingSource;
  if (p && p.shopId === shopId && Date.now() - p.at < SOURCE_TTL_MS) {
    pendingSource = null;
    return p.source;
  }
  return fallback;
}

// ── 화면 이름(app_screen_view) ──
// 주요 화면만. 로그인은 /splash에서도 같은 화면이 펼쳐져서 LoginScreen이 직접 보낸다.
function screenNameOf(pathname: string): string | null {
  if (pathname === '/home') return 'home';
  if (pathname.startsWith('/shop/')) return 'shop_detail';
  if (pathname === '/notifications') return 'notifications';
  if (pathname === '/my') return 'my';
  if (pathname === '/favorites') return 'favorites';
  return pathname.replace(/\/[^/]*[0-9][^/]*/g, '/:id').replace(/^\//, '') || 'entry';
}

const DAY_KEYS = ['today', 'tomorrow', 'day_after'] as const;

/**
 * 이벤트 헬퍼. `track(name, params)`로 임의 이벤트도 보낼 수 있다.
 * 각 헬퍼 주석의 "1회" 규칙은 호출부 + 여기 dedupe가 함께 보장한다.
 */
export const track = Object.assign(trackCore, {
  /** app_screen_view — 라우트(pathname) 변경 시. 주요 화면 외 경로는 무시 */
  screen(pathname: string) {
    const screen_name = screenNameOf(pathname);
    if (screen_name) trackCore('app_screen_view', { screen_name });
  },
  /** app_screen_view(login) — 로그인 화면이 실제로 펼쳐질 때(LoginScreen) */
  loginScreen() {
    trackCore('app_screen_view', { screen_name: 'login' });
  },

  /** sign_up(신규) / login(기존) — POST /auth/:provider 성공 응답의 isNewUser로 가른다 */
  auth(provider: string, isNewUser: boolean) {
    if (isNewUser) trackCore('sign_up', { signup_method: provider, method: provider });
    else trackCore('login', { login_method: provider, method: provider });
  },

  /**
   * shop_view — 샵 상세(라우트) 또는 홈 포커스 시트가 데이터를 받아 처음 그려질 때.
   * 호출부가 마운트당 샵 id 1회로 부른다. 웹과 같은 이름 + 웹 측정기준(shop_category·shop_district)도 함께.
   */
  shopView(p: { isPartner: boolean; shopId: string; category?: string | null; region?: string | null; fallbackSource: ShopViewSource }) {
    const source = takeShopSource(p.shopId, p.fallbackSource);
    trackCore('shop_view', {
      shop_id: p.shopId,
      shop_type: p.isPartner ? 'partner' : 'general',
      is_partner: p.isPartner ? 1 : 0,
      category: p.category,
      region: p.region,
      source,
      shop_category: p.category,
      shop_district: p.region,
    });
  },

  /**
   * slot_list_view — "예약 가능 시간" 섹션이 처음 보일 때(reason=shown, 샵당 1회) / 날짜 탭을 바꿀 때(reason=tab, 누를 때마다).
   */
  slotListView(p: { shopId: string; dayIndex: number; slotCount: number; reason: 'shown' | 'tab' }) {
    const params = {
      shop_id: p.shopId,
      day: DAY_KEYS[p.dayIndex] ?? String(p.dayIndex),
      slot_count: p.slotCount,
      trigger: p.reason,
    };
    // shown은 같은 화면 인스턴스 안에서 1회 — 호출부 ref로 막고, 여기선 탭 전환만 그대로 보낸다.
    trackCore('slot_list_view', params);
  },

  /** reserve_click — 예약 버튼(온라인 예약·전화예약) 누름. 웹과 같은 이름 + 웹 파라미터 route도 함께 */
  reserveClick(p: { isPartner: boolean; shopId: string; method: string; slotDate?: string; slotTime?: string }) {
    trackCore('reserve_click', {
      shop_id: p.shopId,
      shop_type: p.isPartner ? 'partner' : 'general',
      is_partner: p.isPartner ? 1 : 0,
      reservation_method: p.method,
      route: p.method,
      slot_date: p.slotDate,
      slot_time: p.slotTime,
    });
  },

  /** favorite_add / favorite_remove — 서버 토글 성공(onSuccess) 시 1회 */
  favorite(shopId: string, added: boolean) {
    trackCore(added ? 'favorite_add' : 'favorite_remove', { shop_id: shopId });
  },

  /** neighborhood_set — 관심 동네 저장 성공 시 1회. 처음이면 set, 바꾸면 change */
  neighborhoodSet(p: { name: string; code: string; action: 'set' | 'change' }) {
    trackCore('neighborhood_set', { region: p.name, region_code: p.code, action: p.action });
  },

  /** slot_alert_created — 빈자리 알림 신청 POST 성공 시 1회 */
  slotAlertCreated(p: { shopId: string; date: string; timeCount: number }) {
    trackCore('slot_alert_created', { shop_type: 'partner', shop_id: p.shopId, date: p.date, time_count: p.timeCount });
  },

  /** push_permission_granted — 권한 요청 직후 허용으로 바뀐 것이 확인됐을 때. 세션당 1회 */
  pushPermissionGranted(trigger: 'startup' | 'settings_toggle') {
    trackOnce('push_permission_granted', 'push_permission_granted', { trigger });
  },

  /** push_opened — 알림을 눌러 앱이 이 화면으로 왔을 때(셸 navigate 이벤트, 또는 ?from=push 첫 주소) */
  pushOpened(path: string) {
    const shopId = path.match(/^\/shop\/([^/?#]+)/)?.[1];
    trackCore('push_opened', { shop_id: shopId, path: shopId ? undefined : path.split('?')[0] });
    if (shopId) markShopSource(shopId, 'push');
  },
});

// ── 초기화(루트 레이아웃에서 1회) ──
const FIRST_OPEN_KEY = 'syak.analytics.firstOpenSent';
let initialized = false;

/**
 * anonymous_id(user_property) · user_id 동기화 · app_first_open을 준비한다. 웹 빌드에서만 의미가 있다.
 * 해제 함수를 돌려준다.
 */
export function initAnalytics(): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};
  if (initialized) return () => {};
  initialized = true;
  const stopInteractions = installInteractionTracking((name, params) => trackCore(name, params));
  let referrerHost = 'direct';
  try { if (document.referrer) referrerHost = new URL(document.referrer).hostname; } catch { /* unavailable */ }
  trackCore('service_enter', { source: referrerHost });
  let lastVisibleAt = Date.now();
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') trackCore('service_background', { ms: Date.now() - lastVisibleAt });
    else { lastVisibleAt = Date.now(); trackCore('service_resume'); }
  };
  document.addEventListener('visibilitychange', onVisibility);

  // 익명 설치 ID
  getDeviceId()
    .then((id) => {
      anonymousId = id;
      delivery.setIdentity(currentUserId ?? null, id);
      safe(() => gtag()?.('set', 'user_properties', { anonymous_id: id }));
    })
    .catch(() => {});

  // user_id = 로그인 유저의 내부 UUID. 로그아웃(user=null)이면 해제.
  setAnalyticsUserId(useAuthStore.getState().user?.id ?? null);
  const unsub = useAuthStore.subscribe((s) => setAnalyticsUserId(s.user?.id ?? null));

  // app_first_open — 셸(iOS/Android 앱) 안에서 처음 실행됐을 때만. AsyncStorage(웹뷰 localStorage)
  // 플래그로 설치당 1회. 앱 삭제·재설치 시 저장소가 지워져 다시 1회.
  if (inShell()) {
    AsyncStorage.getItem(FIRST_OPEN_KEY)
      .then((v) => {
        if (v) return;
        trackCore('app_first_open', {});
        return AsyncStorage.setItem(FIRST_OPEN_KEY, String(Date.now()));
      })
      .catch(() => {});
  }

  return () => {
    stopInteractions();
    document.removeEventListener('visibilitychange', onVisibility);
    unsub();
    initialized = false;
  };
}
