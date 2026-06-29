import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bell, User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

const logo = require('../../../../assets/images/logo-syak.png');

// 헤더: 로고 + 알림/프로필 아이콘. 상단 핑크 그라데이션 위에 올라감.
export function HomeHeader() {
  return (
    <View className="flex-row items-center justify-between pl-5 pr-2.5">
      <Image source={logo} style={{ width: 80, height: 32 }} contentFit="contain" />
      <View className="flex-row items-center">
        <Pressable className="p-2" hitSlop={4} onPress={() => router.push('/notifications')}>
          <Bell size={24} color={colors.gray[800]} fill={colors.gray[800]} />
        </Pressable>
        <Pressable className="p-2" hitSlop={4} onPress={() => router.push('/my')}>
          <User size={24} color={colors.gray[800]} fill={colors.gray[800]} />
        </Pressable>
      </View>
    </View>
  );
}
