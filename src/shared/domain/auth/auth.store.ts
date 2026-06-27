import { create } from 'zustand';
import type { AuthUser } from './auth.types';

// 클라이언트 세션 상태 (서버 데이터가 아닌 순수 클라 상태 → Zustand).
// 토큰은 HTTP-only 쿠키에 있으므로 여기서 다루지 않는다.
type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
