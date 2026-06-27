// 백엔드(syakBE) Base URL. .env 의 EXPO_PUBLIC_API_URL 로 주입된다.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
