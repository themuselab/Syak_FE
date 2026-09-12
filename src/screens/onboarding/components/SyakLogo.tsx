import { Image } from 'expo-image';
import { View } from 'react-native';

// 브랜드 로고 락업(리메이크): 심볼 마크(배경 없는 핑크 S) 위 + syak 워드마크 아래.
// 스플래시·로그인 화면이 공용으로 쓴다. width = 락업 전체 기준 너비.
const markSource = require('../../../../assets/images/logo-mark.png'); // 492x512 (투명)
const wordSource = require('../../../../assets/images/logo-syak.png'); // 452x192 (2.35:1)

const MARK_RATIO = 512 / 492; // 마크 h/w
const WORD_RATIO = 192 / 452; // 워드마크 h/w

type Props = { width: number; height?: number };

export function SyakLogo({ width }: Props) {
  const markW = Math.round(width * 0.5);
  const wordW = Math.round(width * 0.45);

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <Image
        source={markSource}
        style={{ width: markW, height: Math.round(markW * MARK_RATIO) }}
        contentFit="contain"
      />
      <Image
        source={wordSource}
        style={{ width: wordW, height: Math.round(wordW * WORD_RATIO) }}
        contentFit="contain"
      />
    </View>
  );
}
