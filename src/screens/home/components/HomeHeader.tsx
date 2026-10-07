import { router } from 'expo-router';
import { Bell, User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

// 헤더 아이콘(알림·프로필). 검색바와 같은 줄에 오른쪽으로 붙는다(디자이너 시안).
// 검색창이 포커스되면 부모(HomeScreen)가 이 줄을 숨겨 검색창이 가로로 넓어진다.
export function HomeHeader() {
  return (
    // box-none: 아이콘 외 빈 공간의 탭은 아래 지도로 흘려보낸다(QA #60).
    <View pointerEvents="box-none" className="flex-row items-center">
      {/* p-1.5 → 행 높이 36px(24+6+6). 탭 타깃은 36 + hitSlop 4 = 44px로 접근성 기준 유지. */}
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
