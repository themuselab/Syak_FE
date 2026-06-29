import { RotateCcw } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

// 빈 상태: 조건에 맞는 샵 없을 때 + 초기화 버튼.
export function ShopListEmpty({ onReset }: { onReset: () => void }) {
  return (
    <View className="items-center justify-center gap-3 pt-16">
      <Text className="text-body-m font-pretendard text-gray-600">조건에 맞는 샵을 못찾았어요🥹</Text>
      <Pressable onPress={onReset} className="items-center gap-1" hitSlop={8}>
        <RotateCcw size={20} color={colors.gray[700]} />
        <Text className="text-body-m font-pretendard text-gray-700">초기화</Text>
      </Pressable>
    </View>
  );
}
