import { Text, View } from 'react-native';

import type { InfoRow } from '../mockShopDetail';

type Props = {
  info: InfoRow[];
};

// 정보 섹션: 라벨 / 값 (주소·오늘 예약·전화).
export function InfoSection({ info }: Props) {
  return (
    <View className="gap-4">
      <Text
        className="font-pretendard-medium text-[18px]"
        style={{ color: '#1a1a1a', letterSpacing: -0.36 }}
      >
        정보
      </Text>
      <View className="gap-4">
        {info.map((row) => (
          <View key={row.label} className="flex-row items-center justify-between gap-1">
            <Text
              className="font-pretendard-medium text-[15px]"
              style={{ color: '#7e7e7e', letterSpacing: -0.3 }}
            >
              {row.label}
            </Text>
            <Text
              className="font-pretendard-medium text-[15px]"
              style={{ color: '#1a1a1a', letterSpacing: -0.3 }}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
