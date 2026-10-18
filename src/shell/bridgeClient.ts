import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type {
  ShellEnvelope,
  ShellInfo,
  ShellMessage,
  ShellRequest,
  ShellResponseData,
} from './bridge.types';

// 웹 쪽 브리지 클라이언트. 웹뷰 셸 안에서 열렸을 때만 동작하고, 일반 브라우저에선 inShell()이
// false라 호출부가 각자 웹 대체 동작(또는 "앱에서만 가능")으로 간다.

type ShellWindow = Window & {
  __SYAK_SHELL__?: ShellInfo;
  ReactNativeWebView?: { postMessage: (data: string) => void };
  __syakBridge?: { receive: (msg: ShellMessage) => void };
};

const w = (): ShellWindow | null => (typeof window === 'undefined' ? null : (window as ShellWindow));

/** 셸이 심어둔 정보. 웹뷰 셸 밖(일반 브라우저·네이티브 앱)이면 null */
export function shellInfo(): ShellInfo | null {
  if (Platform.OS !== 'web') return null;
  return w()?.__SYAK_SHELL__ ?? null;
}

/**
 * 화면(컴포넌트)에서 셸 정보가 필요할 때 쓰는 훅. 첫 렌더는 null이고 화면이 붙은 뒤 값이 들어온다.
 * 웹은 빌드 때 화면을 미리 그려두는데(정적 export), 첫 렌더부터 셸에 따라 다르게 그리면 미리 그린
 * 화면과 달라 React가 하이드레이션 오류(#418)를 내고 통째로 다시 그린다.
 */
export function useShellInfo(): ShellInfo | null {
  const [info, setInfo] = useState<ShellInfo | null>(null);
  useEffect(() => setInfo(shellInfo()), []);
  return info;
}

export function inShell(): boolean {
  return shellInfo() !== null && !!w()?.ReactNativeWebView;
}

type Pending = { resolve: (v: unknown) => void; reject: (e: unknown) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<string, Pending>();
const listeners = new Map<string, Set<(msg: ShellMessage) => void>>();
let seq = 0;

export class ShellCallError extends Error {
  kind: string;
  constructor(kind: string, message: string) {
    super(message);
    this.name = 'ShellCallError';
    this.kind = kind;
  }
}

// 셸이 injectJavaScript로 부르는 수신 함수. 모듈 로드 시 한 번 설치한다.
function install() {
  const win = w();
  if (!win || win.__syakBridge) return;
  win.__syakBridge = {
    receive(msg) {
      if (msg.kind === 'response') {
        const p = pending.get(msg.id);
        if (!p) return;
        pending.delete(msg.id);
        clearTimeout(p.timer);
        if (msg.ok) p.resolve(msg.data);
        else p.reject(new ShellCallError(msg.error.kind, msg.error.message));
        return;
      }
      listeners.get(msg.event)?.forEach((cb) => cb(msg));
    },
  };
}
if (Platform.OS === 'web') install();

// 셸에 요청하고 응답을 기다린다. 소셜 로그인은 사용자가 다른 앱(카카오·네이버)에 다녀오므로 넉넉히.
export function callShell<T extends ShellRequest['type']>(
  request: Extract<ShellRequest, { type: T }>,
  timeoutMs = 90_000,
): Promise<ShellResponseData[T]> {
  const win = w();
  if (!win?.ReactNativeWebView) return Promise.reject(new ShellCallError('no_shell', '셸 밖'));
  const id = `${Date.now()}-${++seq}`;
  return new Promise<ShellResponseData[T]>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new ShellCallError('timeout', `셸 응답 없음: ${request.type}`));
    }, timeoutMs);
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
    const envelope: ShellEnvelope = { id, request };
    win.ReactNativeWebView!.postMessage(JSON.stringify(envelope));
  });
}

/** 셸이 보내는 이벤트(알림 탭으로 화면 이동, 푸시 도착) 구독. 해제 함수를 돌려준다 */
export function onShellEvent(
  event: Extract<ShellMessage, { kind: 'event' }>['event'],
  cb: (msg: ShellMessage) => void,
): () => void {
  install();
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(cb);
  return () => listeners.get(event)?.delete(cb);
}
