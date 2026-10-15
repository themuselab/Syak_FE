import { Image } from 'expo-image';
import { View } from 'react-native';

// 브랜드 로고 — 심볼 마크 + 흰색 워드마크(디자이너 시안 2026-10-15).
// 핑크 배경 위에 올라가므로 둘 다 흰 계열이다.
//  symbol    : 360x360 (반투명 흰 그라데이션 S)
//  wordmark  : 452x192, 핑크 원본(logo-syak.png)에서 글자 모양은 그대로 두고 색만 흰색으로 뽑은 것
const symbolSource = require('../../../../assets/images/syak-symbol.png');
const wordmarkSource = require('../../../../assets/images/logo-syak-white.png');

const WORDMARK_RATIO = 192 / 452; // h/w

type Props = {
  /** 심볼 마크 한 변(px). 워드마크는 이 값에 비례해 자동 계산된다. */
  size?: number;
};

export function SyakLogo({ size = 112 }: Props) {
  // 시안 비율: 워드마크 너비 ≈ 심볼의 92%, 둘 사이 간격은 심볼의 4%.
  const wordmarkWidth = Math.round(size * 0.92);
  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={symbolSource}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      <Image
        source={wordmarkSource}
        style={{
          width: wordmarkWidth,
          height: Math.round(wordmarkWidth * WORDMARK_RATIO),
          marginTop: Math.round(size * 0.04),
        }}
        contentFit="contain"
      />
    </View>
  );
}
