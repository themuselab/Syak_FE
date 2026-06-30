import type { SocialProvider } from '@/shared/domain/auth/auth.types';

// 유저 도메인 타입 (syakBE/docs/06-user.md 참조)
export type UserProfile = {
  id: string;
  linkedProviders: SocialProvider[];
  nickname: string | null;
  profileImage: string | null;
  createdAt: string;
};
