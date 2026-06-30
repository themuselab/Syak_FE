import type { ConfigContext, ExpoConfig } from 'expo/config';

// 동적 설정: app.json을 base로 받아 소셜 로그인 config plugin(카카오·네이버)을 추가한다.
// 키는 .env에서 주입 → 키 교체 시 .env만 수정.
export default ({ config }: ConfigContext): ExpoConfig => {
  // 키는 .env(로컬) 또는 EAS 환경변수(빌드)에서 온다. eas init/build의 로컬 config 평가는
  // .env를 읽지 않으므로, 키가 없을 때는 해당 plugin을 빼서 평가가 깨지지 않게 한다.
  // (빌드 시 EAS 환경변수로 키가 주입되면 plugin이 포함된다.)
  const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  const kakaoPlugin = kakaoNativeAppKey
    ? ([['@react-native-kakao/core', { nativeAppKey: kakaoNativeAppKey }]] as NonNullable<
        ExpoConfig['plugins']
      >)
    : [];

  // 네이버 로그인 plugin. iOS 콜백용 URL scheme이 있을 때만 포함(카카오와 동일한 조건부 패턴).
  const naverUrlScheme = process.env.EXPO_PUBLIC_NAVER_URL_SCHEME;
  const naverPlugin = naverUrlScheme
    ? ([['@react-native-seoul/naver-login', { urlScheme: naverUrlScheme }]] as NonNullable<
        ExpoConfig['plugins']
      >)
    : [];

  // 카카오 SDK(com.kakao.sdk:*)는 카카오 전용 Maven 저장소에만 있다. Expo가 저장소를 중앙
  // 관리(settings.gradle)하므로, expo-build-properties로 그 저장소를 추가해야 의존성이 해석된다.
  const buildPropsPlugin = [
    [
      'expo-build-properties',
      { android: { extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'] } },
    ],
  ] as NonNullable<ExpoConfig['plugins']>;

  return {
    ...config,
    name: config.name ?? 'syak',
    slug: config.slug ?? 'syak',
    plugins: [...(config.plugins ?? []), ...buildPropsPlugin, ...kakaoPlugin, ...naverPlugin],
  };
};
