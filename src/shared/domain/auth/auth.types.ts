// 인증 도메인 타입 (syakBE/docs/01-auth.md 참조)
export type SocialProvider = 'kakao' | 'naver' | 'apple';

// 소셜 프로필에서 오는 값이라 nickname/profileImage는 null일 수 있다 (BE 계약).
export type AuthUser = {
  id: string;
  nickname: string | null;
  profileImage: string | null;
};

export type SocialLoginResponse = {
  user: AuthUser;
  isNewUser: boolean;
};
