import type { ConfigContext, ExpoConfig } from 'expo/config';

// 동적 설정: app.json을 base로 받아 카카오 config plugin을 추가한다.
// 네이티브 앱 키는 .env(EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY)에서 주입 → 키 교체 시 .env만 수정.
// (네이티브 앱 키는 앱에 박히는 공개키라 노출돼도 됨. 비밀값 아님.)
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'syak',
  slug: config.slug ?? 'syak',
  plugins: [
    ...(config.plugins ?? []),
    [
      '@react-native-kakao/core',
      { nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY },
    ],
  ],
});
