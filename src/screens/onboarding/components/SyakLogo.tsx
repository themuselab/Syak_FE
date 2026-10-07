import { Image } from 'expo-image';
import { View } from 'react-native';

// 브랜드 로고(리메이크): 배경 없는 핑크 심볼 마크. 스플래시·로그인 공용.
// 디자인 TO-BE 기준 워드마크는 쓰지 않는다(마크 + 하단 태그라인 조합).
// width = 마크 기준 너비(높이는 원본 비율로 계산).
const markSource = require('../../../../assets/images/logo-mark.png'); // 492x512 (투명)

const MARK_RATIO = 512 / 492; // h/w

type Props = { width: number; height?: number };

export function SyakLogo({ width }: Props) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={markSource}
        style={{ width, height: Math.round(width * MARK_RATIO) }}
        contentFit="contain"
      />
    </View>
  );
}
