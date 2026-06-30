const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Windows에서 metro 파일 워처가 불완전 설치된 @emnapi(없는 dist 폴더)를 감시하다 ENOENT로 크래시한다.
// @emnapi는 dev/optional 의존성이라 앱 번들에 쓰이지 않으므로 watch/resolution 대상에서 제외한다.
const emnapiPattern = /[\\/]node_modules[\\/]@emnapi[\\/].*/;
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = Array.isArray(existingBlockList)
  ? [...existingBlockList, emnapiPattern]
  : existingBlockList
    ? [existingBlockList, emnapiPattern]
    : [emnapiPattern];

module.exports = withNativeWind(config, { input: './global.css' });
