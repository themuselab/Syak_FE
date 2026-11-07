import { Image, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

const SYMBOL = require('../../../assets/images/syak-symbol-pink.png');

// "샥 파트너" 배지 — 핑크 틴트 바탕 + 핑크 글자. 시안(2026-11)에서 글자를 12 → 13px로 키웠다.
// 목록 카드는 글자만, 샵 상세 타이틀 줄은 앞에 S 심볼을 붙인다(withSymbol).
export function PartnerBadge({ withSymbol = false }: { withSymbol?: boolean }) {
  return (
    <View
      className="flex-row items-center justify-center rounded-[4px] px-1.5 py-0.5"
      style={{ backgroundColor: colors.brand.tint, gap: 3 }}
    >
      {withSymbol && <Image source={SYMBOL} style={{ width: 12, height: 12 }} resizeMode="contain" />}
      <Text className="font-pretendard-semibold" style={{ fontSize: 13, lineHeight: 18, color: colors.primary[500] }}>
        샥 파트너
      </Text>
    </View>
  );
}
