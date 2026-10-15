import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

const BELL = require('../../../../assets/images/notification-empty.png');

// 알림 없음 (디자이너 시안 2026-10-15 "알림없음"): 회색 벨 + 안내 두 줄, 화면 가운데.
export function NotificationEmpty() {
  return (
    <View className="flex-1 items-center justify-center px-5 pb-16">
      <Image source={BELL} style={{ width: 64, height: 64 }} contentFit="contain" />
      <Text
        className="mt-5 text-center font-pretendard-semibold"
        style={{ fontSize: 16, color: colors.text.strong }}
      >
        아직 도착한 알림이 없어요
      </Text>
      <Text className="mt-1.5 text-center text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
        새로운 소식이 생기면 알려드릴게요!
      </Text>
    </View>
  );
}
