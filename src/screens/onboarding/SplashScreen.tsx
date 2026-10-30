import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { isGuestBrowse } from '@/shared/lib/guestBrowse';
import { preloadHomeMap } from '@/screens/home/components/HomeMap';
import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { getMe } from '@/shared/domain/user/user.api';

import { LoginScreen } from './LoginScreen';

// 첫 진입 화면. 디자인: 디자이너 시안 2026-10-15(핑크 그라데이션 + 흰 로고).
// 세션 확인: GET /users/me 성공 → 로그인 상태(setUser) → /home.
// 실패(비로그인) → 화면을 바꾸지 않고 그 자리에서 로그인으로 전환한다 — 로고·문구가 위로 올라가고
// 버튼 패널이 아래에서 올라오는 한 번의 연속 애니메이션(디자이너 요청). 예전엔 /login으로
// replace해서 화면이 통째로 바뀌는 끊김이 있었다.
export function SplashScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // 다음 화면(홈)의 지도 SDK를 스플래시 대기 시간 동안 병렬로 받아 둔다.
    preloadHomeMap();
    // 최소 표시시간(브랜드 로딩) — 세션 확인이 빨라도 깜빡임 없이 잠깐 보여준다.
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 1200));

    (async () => {
      let loggedIn = false;
      const guest = isGuestBrowse(); // 세션 확인과 동시에 읽는다
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser({ id: me.id, nickname: me.nickname, profileImage: me.profileImage });
          loggedIn = true;
        }
      } catch {
        loggedIn = false; // 비로그인/세션 없음
      }
      await minDelay;
      if (cancelled) return;
      if (loggedIn || (await guest)) router.replace('/home'); // 둘러보기를 한 번 누른 비회원도 바로 홈
      else setRevealed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  return <LoginScreen intro revealed={revealed} />;
}
