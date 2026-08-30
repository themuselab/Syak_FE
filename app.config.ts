import { existsSync } from 'node:fs';

import type { ConfigContext, ExpoConfig } from 'expo/config';

// 동적 설정: app.json을 base로 받아 소셜 로그인 config plugin(카카오·네이버)을 추가한다.
// 키는 .env에서 주입 → 키 교체 시 .env만 수정.
export default ({ config }: ConfigContext): ExpoConfig => {
  // 키는 .env(로컬) 또는 EAS 환경변수(빌드)에서 온다. eas init/build의 로컬 config 평가는
  // .env를 읽지 않으므로, 키가 없을 때는 해당 plugin을 빼서 평가가 깨지지 않게 한다.
  // (빌드 시 EAS 환경변수로 키가 주입되면 plugin이 포함된다.)
  //
  // ★ android/ios 옵션은 반드시 넘겨야 한다. plugin 본체가 `if (android)` / `if (ios)` 로 가드하고
  //   있어서, 안 넘기면 withAndroid·withIos가 통째로 스킵된다(기본값 없음). 그러면
  //   - Android: AuthCodeHandlerActivity(kakao{키}://oauth) 미주입 → 카카오계정(웹) 로그인 콜백 유실
  //     → 카카오톡 미설치 기기에서 promise가 영영 안 끝나 "무한 로딩"
  //   - iOS: CFBundleURLTypes·LSApplicationQueriesSchemes 미주입 → 카카오 로그인 전면 불가
  //   카카오톡 설치 기기는 앱 간 로그인(loginWithKakaoTalk)이라 manifest 없이도 성공 —
  //   이 때문에 "어떤 사람은 되고 어떤 사람은 안 되는" 증상으로 보였다(QA 3차).
  const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  const kakaoPlugin = kakaoNativeAppKey
    ? ([
        [
          '@react-native-kakao/core',
          {
            nativeAppKey: kakaoNativeAppKey,
            // 채널·카카오링크·내비는 미사용이라 해당 옵션은 켜지 않는다.
            android: { authCodeHandlerActivity: true },
            ios: { handleKakaoOpenUrl: true },
          },
        ],
      ] as NonNullable<ExpoConfig['plugins']>)
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
  const hasIosFirebaseFile = existsSync(iosGoogleServices);
  // ★ iOS 빌드에선 기본적으로 Firebase 제외. RNFirebase+static frameworks가 Expo54/RN0.81에서
  //   pod install·컴파일 실패(RCTPromiseRejectBlock 등). 이번 iOS 빌드는 푸시·분석 다 꺼져 있어
  //   Firebase가 하는 일이 없으므로 빼도 기능 손실 0. JS는 dynamic import 가드라 네이티브 모듈
  //   없어도 조용히 통과(push.ts·analytics.ts). Android 빌드·로컬 prebuild는 영향 없음.
  //   재활성(추후 푸시/분석 iOS 붙일 때): iOS 빌드 env에 SYAK_IOS_FIREBASE=on.
  //   짝꿍: react-native.config.js가 같은 조건으로 iOS pod(autolink)도 제외한다.
  const iosBuild = process.env.EAS_BUILD_PLATFORM === 'ios';
  const hasIosFirebase = hasIosFirebaseFile && !(iosBuild && process.env.SYAK_IOS_FIREBASE !== 'on');
  // config plugin은 지금 빌드되는 플랫폼에만 적용됨 → iOS 빌드에서 firebase off면 plugin도 빼야
  // AppDelegate에 Firebase 코드가 안 들어가 pod 없이도 컴파일된다.
  const firebaseForThisBuild = iosBuild ? hasIosFirebase : hasAndroidFirebase || hasIosFirebase;
  const firebasePlugins = firebaseForThisBuild
    ? ([
        '@react-native-firebase/app',
        '@react-native-firebase/messaging',
        '@react-native-firebase/analytics',
      ] as NonNullable<ExpoConfig['plugins']>)
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
      usesAppleSignIn: true, // Apple 로그인(iOS 전용) 엔타이틀먼트
      ...(hasIosFirebase ? { googleServicesFile: iosGoogleServices } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      ...buildPropsPlugin,
      ...firebasePlugins,
      // RNFirebase + static frameworks의 non-modular header 컴파일 에러 픽스(Podfile 패치).
      ...(hasIosFirebase ? (['./plugins/withNonModularHeaders'] as NonNullable<ExpoConfig['plugins']>) : []),
      ...kakaoPlugin,
      ...naverPlugin,
      ...naverMapPlugin,
      'expo-apple-authentication', // Apple 로그인 config plugin (iOS 엔타이틀먼트 주입)
    ],
  };
};
