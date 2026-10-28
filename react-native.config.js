// 네이티브 앱은 웹뷰 셸만 띄운다(index.native.tsx). 예전 네이티브 화면에서만 쓰던 네이티브 모듈은
// 앱 바이너리에 링크하지 않는다 — JS 패키지는 웹 번들(Vercel)이 그대로 쓰므로 지우지 않는다.
// 네이버 지도 SDK가 안드로이드 기기당 약 25MB였다(앱 용량 2026-10-28). Expo 모듈은 package.json expo.autolinking.exclude.
const notNative = { platforms: { android: null, ios: null } };

module.exports = {
  dependencies: {
    '@mj-studio/react-native-naver-map': notNative,
    'react-native-svg': notNative,
    'react-native-gesture-handler': notNative,
    'react-native-screens': notNative,
  },
};
