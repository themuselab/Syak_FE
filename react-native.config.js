// RN CLI autolinking 설정.
//
// v1에서는 @react-native-firebase(app/analytics/messaging) 네이티브 pod을 양 플랫폼에서
// autolink 제외한다. RNFirebase가 Expo54/RN0.81 iOS에서 어떤 조합으로도 빌드 실패(New Arch
// TurboModule 코드젠 / SPM+static / non-modular header)라, 네이티브 Firebase를 완전히 빼서
// 빌드를 통과시킨다. 분석·푸시는 v1.1에서 재도입(필요시 expo-notifications 등).
//  - JS는 dynamic import 가드(push.ts·analytics.ts)라 네이티브 모듈 없어도 무해
//  - 패키지는 설치된 채로 둔다(Metro가 JS를 resolve해야 함) — 네이티브만 제외
const bothNull = { platforms: { ios: null, android: null } };

module.exports = {
  dependencies: {
    '@react-native-firebase/app': bothNull,
    '@react-native-firebase/analytics': bothNull,
    '@react-native-firebase/messaging': bothNull,
  },
};
