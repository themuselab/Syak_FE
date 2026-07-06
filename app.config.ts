import { existsSync } from 'node:fs';

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

  // 네이버 지도 plugin. NCP Maps Client ID가 있을 때만 포함(로그인 키와 별개).
  const naverMapClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;
  const naverMapPlugin = naverMapClientId
    ? ([['@mj-studio/react-native-naver-map', { client_id: naverMapClientId }]] as NonNullable<
        ExpoConfig['plugins']
      >)
    : [];

  // Firebase(FCM 푸시). google-services 파일은 커밋하지 않고(.gitignore) 로컬은 루트 파일,
  // EAS 빌드는 file 타입 환경변수(GOOGLE_SERVICES_JSON 등)가 경로를 준다.
  // 파일이 있을 때만 plugin·googleServicesFile을 포함 — 없는 환경(파일 미준비·CI)에서 평가가 깨지지 않게(조건부 패턴).
  const androidGoogleServices = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
  const iosGoogleServices = process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist';
  const hasAndroidFirebase = existsSync(androidGoogleServices);
  const hasIosFirebase = existsSync(iosGoogleServices);
  const firebasePlugins =
    hasAndroidFirebase || hasIosFirebase
      ? (['@react-native-firebase/app', '@react-native-firebase/messaging'] as NonNullable<
          ExpoConfig['plugins']
        >)
      : [];

  // 카카오·네이버지도 SDK는 각 전용 Maven 저장소에만 있다. Expo가 저장소를 중앙 관리(settings.gradle)
  // 하므로, expo-build-properties로 그 저장소들을 추가해야 의존성이 해석된다.
  // iOS static frameworks는 RNFirebase 필수 — firebase 활성 시에만 켠다(다른 pod 영향 최소화).
  const buildPropsPlugin = [
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: [
            'https://devrepo.kakao.com/nexus/content/groups/public/',
            'https://repository.map.naver.com/archive/maven',
          ],
        },
        ...(hasIosFirebase ? { ios: { useFrameworks: 'static' } } : {}),
      },
    ],
  ] as NonNullable<ExpoConfig['plugins']>;

  return {
    ...config,
    name: config.name ?? 'syak',
    slug: config.slug ?? 'syak',
    android: {
      ...config.android,
      ...(hasAndroidFirebase ? { googleServicesFile: androidGoogleServices } : {}),
    },
    ios: {
      ...config.ios,
      ...(hasIosFirebase ? { googleServicesFile: iosGoogleServices } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      ...buildPropsPlugin,
      ...firebasePlugins,
      ...kakaoPlugin,
      ...naverPlugin,
      ...naverMapPlugin,
    ],
  };
};
