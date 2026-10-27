import { Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

// 빈 상태의 회색 (i) 원(디자이너 시안 — 검색·조건 결과 없음, 관심 동네 검색 결과 없음 공용).
export function InfoBadge({ size = 48 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        className="font-pretendard-semibold"
        style={{ fontSize: size * 0.5, lineHeight: size * 0.62, color: colors.white }}
      >
        i
      </Text>
    </View>
  );
}
