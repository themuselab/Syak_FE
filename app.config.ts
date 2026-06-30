import type { ConfigContext, ExpoConfig } from 'expo/config';

// 동적 설정: app.json을 base로 받아 카카오 config plugin을 추가한다.
// 네이티브 앱 키는 .env(EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY)에서 주입 → 키 교체 시 .env만 수정.
// (네이티브 앱 키는 앱에 박히는 공개키라 노출돼도 됨. 비밀값 아님.)
export default ({ config }: ConfigContext): ExpoConfig => {
  // 키는 .env(로컬) 또는 EAS 환경변수(빌드)에서 온다. eas init/build의 로컬 config 평가는
  // .env를 읽지 않으므로, 키가 없을 때는 카카오 plugin을 빼서 평가가 깨지지 않게 한다.
  // (빌드 시 EAS 환경변수로 키가 주입되면 plugin이 포함된다.)
  const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  const kakaoPlugin = kakaoNativeAppKey
    ? ([['@react-native-kakao/core', { nativeAppKey: kakaoNativeAppKey }]] as NonNullable<
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
    plugins: [...(config.plugins ?? []), ...buildPropsPlugin, ...kakaoPlugin],
  };
};
