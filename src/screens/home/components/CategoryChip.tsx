import { Image } from 'expo-image';
import { Pressable, Text } from 'react-native';

import { colors, shadow } from '@/shared/theme/colors';

const SYMBOL = require('../../../../assets/images/syak-symbol-pink.png');

type Props = {
  label: string;
  /** "샥 파트너샵" 칩 — 브랜드 칩이라 항상 연분홍 톤 + 심볼 아이콘 */
  brand?: boolean;
  onPress?: () => void;
};

// 홈 상단(지도 위) 칩 (디자이너 시안 2026-10-15).
//  일반(시술 분야) = 흰 배경 + 진한 글씨, 테두리 없이 그림자로 지도와 분리
//  브랜드(샥 파트너) = 연분홍 배경 + 핑크 테두리·글씨 + 심볼
// 칩을 고르면 칩 줄이 사라지고 검색바가 "< 네일 ✕" 헤더로 바뀌므로 "선택된 칩" 모양은 없다.
export function CategoryChip({ label, brand, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="h-[33px] flex-row items-center justify-center gap-1 rounded-full px-3.5"
      style={{
        backgroundColor: brand ? colors.brand.tint : colors.white,
        borderWidth: brand ? 1 : 0,
        borderColor: colors.primary[300],
        ...shadow.sm,
      }}
    >
      {brand && <Image source={SYMBOL} style={{ width: 16, height: 16 }} contentFit="contain" />}
      <Text
        className="text-body-m font-pretendard-medium"
        style={{ color: brand ? colors.primary[500] : colors.text.strong }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
