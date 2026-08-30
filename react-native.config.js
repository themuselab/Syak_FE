// RN CLI autolinking 설정.
//
// @react-native-firebase/messaging 의 TurboModule(NativeRNFBTurboMessaging)이 Expo 54 / RN 0.81
// New Architecture iOS 코드젠과 안 맞아 컴파일 실패한다
// ("cannot initialize return object of type 'ModuleConstants<...Constants::Builder>'").
// iOS에선 messaging pod만 autolink에서 제외한다. 이유:
//  - 이번 빌드는 iOS 푸시가 어차피 비활성(APNs 미설정 + aps-environment 제거)이라 기능 손실 0
//  - app / analytics pod은 유지 → Firebase 초기화·GA4 인프라는 iOS에도 그대로
//  - JS의 messaging import는 dynamic import 가드(push.ts)라 네이티브 모듈 없어도 조용히 통과
//  - messaging 플러그인은 iOS mod가 없어(안드 아이콘 설정만) 남겨둬도 무해
// Android는 영향 없음(messaging pod 유지). 추후 iOS 푸시 붙일 때 이 제외만 풀면 된다.
module.exports = {
  dependencies: {
    '@react-native-firebase/messaging': { platforms: { ios: null } },
  },
};
