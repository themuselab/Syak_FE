import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bell, User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

const logo = require('../../../../assets/images/logo-syak.png');

// 헤더: 로고 + 알림/프로필 아이콘. 상단 핑크 그라데이션 위에 올라감.
export function HomeHeader() {
  return (
    // box-none: 로고~아이콘 사이 빈 공간의 탭은 아래 지도로 흘려보낸다(QA #60).
    <View pointerEvents="box-none" className="flex-row items-center justify-between pl-5 pr-2.5">
      <Image source={logo} style={{ width: 80, height: 32 }} contentFit="contain" />
      {/* p-1.5 → 행 높이 36px(24+6+6). 헤더 전체 높이 축소용(QA #61).
          탭 타깃은 36 + hitSlop 4 = 44px로 접근성 기준 유지. */}
      <View className="flex-row items-center">
        <Pressable className="p-1.5" hitSlop={4} onPress={() => router.push('/notifications')}>
          <Bell size={24} color={colors.gray[800]} fill={colors.gray[800]} />
        </Pressable>
        <Pressable className="p-1.5" hitSlop={4} onPress={() => router.push('/my')}>
          <User size={24} color={colors.gray[800]} fill={colors.gray[800]} />
        </Pressable>
      </View>
    </View>
  );
}
