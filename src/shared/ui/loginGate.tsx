import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { LoginPromptModal } from '@/shared/ui/LoginPromptModal';

// 비회원 게이팅은 화면마다 두 가지 모양으로 반복돼 있었다. 그 두 가지를 여기 모은다.
//  (1) useLoginGate  — 특정 "동작"만 막는다(별 탭, 알림 토글 등). 화면은 그대로 보인다.
//  (2) LoginRequired — 화면 "전체"를 막는다(즐겨찾기·계정·닉네임). 콘텐츠 대신 이걸 렌더.

/**
 * 비회원이 누르면 로그인 유도 모달, 회원이면 그대로 실행.
 *
 *   const { isLoggedIn, requireLogin, loginModal } = useLoginGate();
 *   <Star onPress={() => requireLogin(() => toggleFavorite(id))} />
 *   ...
 *   {loginModal}
 */
export function useLoginGate() {
  const isLoggedIn = useAuthStore((s) => s.user) != null;
  const [visible, setVisible] = useState(false);

  const requireLogin = useCallback(
    (action: () => void) => {
      if (isLoggedIn) action();
      else setVisible(true);
    },
    [isLoggedIn],
  );

  const loginModal = (
    <LoginPromptModal
      visible={visible}
      // 로그인 화면으로 이동하기 전에 모달을 먼저 닫아야 push된 화면을 모달이 덮지 않는다.
      onClose={() => setVisible(false)}
      onPressLogin={() => {
        setVisible(false);
        router.push('/login');
      }}
    />
  );

  return { isLoggedIn, requireLogin, loginModal };
}

/**
 * 로그인해야만 의미가 있는 화면(즐겨찾기·계정·닉네임)의 비회원 상태.
 * 닫기 = 진입 전 화면으로, 로그인 = replace(뒤로 돌아와도 막힌 화면이 아니게).
 */
export function LoginRequired() {
  return (
    <LoginPromptModal
      visible
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      onPressLogin={() => router.replace('/login')}
    />
  );
}
