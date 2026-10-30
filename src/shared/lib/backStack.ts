import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { callShell, inShell, onShellEvent } from '@/shell/bridgeClient';

// 안드로이드 물리 뒤로가기(웹뷰 셸 안). 모달·시트는 브라우저 히스토리가 아니라서 셸이 웹뷰 히스토리만
// 보면 "모달이 떠 있는데 앱이 꺼진다". 셸은 뒤로가기를 웹에 넘기고(hardwareBack), 웹이 여기서 처리한다:
//   1) 열린 오버레이가 있으면 가장 나중에 연 것(LIFO)을 닫는다
//   2) 없으면 앱 내비게이션 뒤로(router.back)
//   3) 첫 화면이면 셸에 앱 종료를 요청
// 셸 밖(일반 브라우저)에서는 이벤트가 오지 않으므로 아무 일도 하지 않는다. docs/webview-migration.md

type Entry = { run: () => void };
const stack: Entry[] = [];

function handleBack(): boolean {
  const top = stack[stack.length - 1];
  if (top) {
    top.run();
    return false;
  }
  if (router.canGoBack()) {
    router.back();
    return false;
  }
  // 푸시로 샵 상세 등에 바로 들어와 쌓인 화면이 없으면 홈으로(화면의 뒤로 버튼과 같게). 홈·로그인에서만 종료.
  const path = typeof window !== 'undefined' ? window.location.pathname : '/home';
  if (!['/', '/home', '/login', '/splash'].includes(path)) {
    router.replace('/home');
    return false;
  }
  return true; // 홈·로그인 화면에서 닫을 것도 없음 → 앱 종료
}

/** 루트 레이아웃에서 1회. 셸의 hardwareBack 이벤트를 받아 처리하고 결과를 셸에 알린다. */
export function installHardwareBack(): () => void {
  if (!inShell()) return () => {};
  return onShellEvent('hardwareBack', (msg) => {
    if (msg.kind !== 'event' || msg.event !== 'hardwareBack') return;
    let exit = false;
    try {
      exit = handleBack();
    } catch {
      exit = false; // 핸들러 오류로 앱이 꺼지지 않게
    }
    // 셸은 이 응답이 없으면(웹 미로드 등) 잠시 뒤 자체 동작으로 넘어간다 — 그래서 처리했어도 반드시 알린다.
    callShell({ type: 'backHandled', id: msg.id, exit }, 3000).catch(() => {});
  });
}

/**
 * 오버레이(모달·시트·패널)가 열려 있는 동안 뒤로가기를 가로챈다. 보통 onBack = 닫기 동작.
 * 화면이 포커스일 때만 등록한다 — 스택 아래로 깔린 화면(웹은 언마운트 안 됨)의 열린 시트가
 * 지금 화면의 뒤로가기를 가로채지 않게.
 */
export function useHardwareBack(enabled: boolean, onBack: () => void) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      // onBack이 매 렌더 바뀌어도 재등록하지 않는다(재등록되면 맨 위로 올라가 LIFO 순서가 깨진다).
      const entry: Entry = { run: () => ref.current() };
      stack.push(entry);
      return () => {
        const i = stack.lastIndexOf(entry);
        if (i >= 0) stack.splice(i, 1);
      };
    }, [enabled]),
  );
}
