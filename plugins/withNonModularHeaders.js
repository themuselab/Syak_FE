const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * RNFirebase + `use_frameworks! :linkage => :static` (Expo 54 / RN 0.81) iOS 빌드 픽스 2종을
 * Podfile에 주입한다.
 *
 * 1) `$RNFirebaseDisableSPM = true` (파일 최상단, target 블록 이전)
 *    RNFirebase v26은 firebase-ios-sdk를 SPM으로 가져오는데, SPM 제품이 자동 라이브러리라
 *    static linkage에서 각 RNFB pod이 Firebase 사본을 임베드→중복 심볼로 pod install 실패
 *    ("SPM + static linkage is not supported"). SPM을 끄면 CocoaPods로 firebase-ios-sdk를
 *    받아 static frameworks와 정상 동작한다. (RNFirebase가 안내한 해법)
 *
 * 2) post_install에 CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
 *    static frameworks에서 RNFB 헤더가 React 비모듈러 헤더를 include → -Werror로 깨지는 것 허용.
 */
const SPM_FLAG = '$RNFirebaseDisableSPM = true';
const CLANG_MARKER = 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';
const CLANG_SNIPPET = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['${CLANG_MARKER}'] = 'YES'
      end
    end`;

module.exports = function withRNFirebaseiOSFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      // 1) SPM 비활성 전역 플래그를 최상단에 (target 블록 이전).
      if (!contents.includes(SPM_FLAG)) {
        contents = `${SPM_FLAG}\n${contents}`;
      }

      // 2) post_install에 CLANG 허용 주입.
      if (!contents.includes(CLANG_MARKER) && /post_install do \|installer\|/.test(contents)) {
        contents = contents.replace(/post_install do \|installer\|/, (m) => m + CLANG_SNIPPET);
      }

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
