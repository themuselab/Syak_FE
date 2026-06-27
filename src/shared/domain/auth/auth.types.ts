// 인증 도메인 타입 (syakBE/docs/01-auth.md 참조)
export type SocialProvider = 'kakao' | 'naver' | 'apple';

export type AuthUser = {
  id: string;
  nickname: string;
  profileImage: string;
};

export type SocialLoginResponse = {
  user: AuthUser;
  isNewUser: boolean;
};
