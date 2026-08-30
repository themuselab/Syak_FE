// RN CLI autolinking 설정. app.config.ts의 Firebase iOS 게이팅과 짝을 이룬다.
//
// iOS 빌드에선 @react-native-firebase/* 네이티브 pod을 autolink에서 제외한다.
// 이유: RNFirebase + use_frameworks!(static)가 Expo 54 / RN 0.81에서 pod install·컴파일 실패
// (RCTPromiseRejectBlock 등). 이번 iOS 빌드는 푸시·분석 다 꺼져 있어 Firebase 기능이 없으므로
// pod 자체를 빼서 깨끗이 빌드한다. (app.config.ts는 같은 조건으로 firebase config plugin을 뺀다.)
// Android는 그대로 포함. 재활성: iOS 빌드 env에 SYAK_IOS_FIREBASE=on → 제외 해제.
const excludeIosFirebase =
  process.env.EAS_BUILD_PLATFORM === 'ios' && process.env.SYAK_IOS_FIREBASE !== 'on';

const iosNull = { platforms: { ios: null } };

module.exports = {
  dependencies: excludeIosFirebase
    ? {
        '@react-native-firebase/app': iosNull,
        '@react-native-firebase/analytics': iosNull,
        '@react-native-firebase/messaging': iosNull,
      }
    : {},
};
