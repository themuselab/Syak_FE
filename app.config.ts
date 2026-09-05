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

  // ── Firebase 제외 (v1) ──────────────────────────────────────────────
  // @react-native-firebase(app/analytics/messaging)가 Expo54/RN0.81 iOS에서 어떤 조합으로도
  // 빌드 실패(New Arch TurboModule 코드젠 불일치 / SPM+static / non-modular header). v1에서는
  // 네이티브 Firebase를 완전히 제외해 iOS 빌드를 통과시킨다. 분석·푸시는 v1.1에서 재도입.
  //  - config plugin 미포함(아래 plugins에서 firebase 항목 없음)
  //  - 네이티브 pod은 react-native.config.js가 양 플랫폼에서 autolink 제외
  //  - JS는 dynamic import 가드(push.ts·analytics.ts)라 네이티브 모듈 없어도 무해
  //  - RNFirebase 전용이던 useFrameworks:static / googleServicesFile / SPM 패치도 모두 제거

  // 카카오·네이버지도 SDK는 각 전용 Maven 저장소에만 있다. Expo가 저장소를 중앙 관리(settings.gradle)
  // 하므로, expo-build-properties로 그 저장소들을 추가해야 의존성이 해석된다.
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
      },
    ],
  ] as NonNullable<ExpoConfig['plugins']>;

  return {
    ...config,
    name: config.name ?? 'syak',
    slug: config.slug ?? 'syak',
    ios: {
      ...config.ios,
      usesAppleSignIn: true, // Apple 로그인(iOS 전용) 엔타이틀먼트
    },
    plugins: [
      ...(config.plugins ?? []),
      ...buildPropsPlugin,
      ...kakaoPlugin,
      ...naverPlugin,
      ...naverMapPlugin,
      'expo-notifications', // 푸시(expo-notifications + Expo Push). iOS aps-environment는 프로파일
      //                       재생성(Push capability) 후 app.json ios.entitlements에 추가한다.
      'expo-apple-authentication', // Apple 로그인 config plugin (iOS 엔타이틀먼트 주입)
    ],
  };
};
