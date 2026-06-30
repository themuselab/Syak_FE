import { RotateCcw } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

// 목록 로드 실패 상태 + 다시 시도. (전용 디자인 없어 빈 상태와 동일 톤의 임시 UI)
export function ShopListError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center justify-center gap-3 pt-16">
      <Text className="text-body-m font-pretendard text-gray-600">샵을 불러오지 못했어요</Text>
      <Pressable onPress={onRetry} className="items-center gap-1" hitSlop={8}>
        <RotateCcw size={20} color={colors.gray[700]} />
        <Text className="text-body-m font-pretendard text-gray-700">다시 시도</Text>
      </Pressable>
    </View>
  );
}
