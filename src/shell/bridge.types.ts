// 웹(웹뷰 안 화면) ↔ 네이티브 셸 사이에 오가는 메시지. 양쪽이 이 파일 하나를 같이 쓴다 —
// 한쪽만 바꾸면 조용히 깨지므로 메시지는 반드시 여기에 정의한다(docs/webview-migration.md §4-3).
//
// 웹은 앱이 못 하는 일(소셜 SDK·OS 권한·푸시 토큰·바깥 앱 열기)만 셸에 부탁한다.
// 로그인 세션 자체는 웹이 직접 서버에 요청해 웹뷰 쿠키로 갖는다(app·api가 같은 사이트라 쿠키가 통함).

import type { SocialProvider } from '@/shared/domain/auth/auth.types';

export type Coords = { lat: number; lng: number };

// 웹 → 셸 요청. 셸은 같은 id로 응답한다.
export type ShellRequest =
  | { type: 'socialLogin'; provider: SocialProvider }
  | { type: 'getLocationPermission' }
  | { type: 'requestLocationPermission' }
  | { type: 'getCurrentCoords'; fresh: boolean }
  | { type: 'getPushPermission' }
  | { type: 'togglePushPermission'; next: boolean }
  | { type: 'getPushToken' }
  | { type: 'openSettings' }
  | { type: 'openExternal'; url: string }
  // hardwareBack 이벤트 처리 결과. exit=true면 셸이 앱을 종료한다(웹에 닫을 것도 돌아갈 곳도 없음).
  | { type: 'backHandled'; id: string; exit: boolean };

// 요청별 응답 데이터
export type ShellResponseData = {
  socialLogin: { token: string; name?: string };
  getLocationPermission: { granted: boolean; canAskAgain: boolean };
  requestLocationPermission: boolean;
  getCurrentCoords: Coords | null;
  getPushPermission: { granted: boolean; canAskAgain: boolean };
  togglePushPermission: boolean;
  getPushToken: { token: string; deviceId: string } | null;
  openSettings: null;
  openExternal: null;
  backHandled: null;
};

// 소셜 로그인 실패 종류 — 웹이 원래 에러 클래스로 되돌려 같은 문구를 띄운다.
export type SocialErrorKind = 'cancelled' | 'timeout' | 'not_ready' | 'failed';

export type ShellEnvelope = { id: string; request: ShellRequest };

// 셸 → 웹
export type ShellMessage =
  | { kind: 'response'; id: string; ok: true; data: unknown }
  | { kind: 'response'; id: string; ok: false; error: { kind: SocialErrorKind | 'failed'; message: string } }
  // 푸시 알림을 눌러 앱이 열림/전환됨 → 해당 화면으로
  | { kind: 'event'; event: 'navigate'; path: string }
  // 앱이 켜져 있을 때 푸시가 도착 → 알림 목록 새로고침
  | { kind: 'event'; event: 'pushReceived' }
  // 안드로이드 물리 뒤로가기 → 웹이 오버레이 닫기/화면 뒤로/종료를 정하고 같은 id로 backHandled를 보낸다
  | { kind: 'event'; event: 'hardwareBack'; id: string };

// 셸이 페이지 로드 전에 심어주는 정보(window.__SYAK_SHELL__)
export type ShellInfo = {
  platform: 'ios' | 'android';
  version: string;
  insets: { top: number; bottom: number; left: number; right: number };
};
