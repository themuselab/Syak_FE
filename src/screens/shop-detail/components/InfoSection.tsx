import { Text, View } from 'react-native';

import type { InfoRow } from '../shopDetailToView';

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
          // 라벨은 고정(flexShrink 0), 긴 주소는 값 쪽이 줄바꿈을 흡수한다.
          // 막지 않으면 '오늘 예약' 같은 라벨이 먼저 꺾인다(QA #57과 동일 원인).
          <View key={row.label} className="flex-row items-center justify-between gap-1">
            <Text
              className="font-pretendard-medium text-[15px]"
              numberOfLines={1}
              style={{ color: '#7e7e7e', letterSpacing: -0.3, flexShrink: 0 }}
            >
              {row.label}
            </Text>
            <Text
              className="font-pretendard-medium text-[15px]"
              style={{ color: '#1a1a1a', letterSpacing: -0.3, flexShrink: 1, textAlign: 'right' }}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
