const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * RNFirebase + `use_frameworks! :linkage => :static` 조합에서 나는 컴파일 에러 픽스.
 *   error: include of non-modular header inside framework module 'RNFBApp...' [-Werror,-Wnon-modular-include-in-framework-module]
 * Pods 프로젝트 전 타깃에 CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES=YES 를 넣어
 * 비모듈러 헤더 include를 에러가 아닌 허용으로 바꾼다. (prebuild 시 Podfile post_install에 주입)
 */
const MARKER = 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';
const SNIPPET = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['${MARKER}'] = 'YES'
      end
    end`;

module.exports = function withNonModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (!contents.includes(MARKER) && /post_install do \|installer\|/.test(contents)) {
        contents = contents.replace(/post_install do \|installer\|/, (m) => m + SNIPPET);
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
