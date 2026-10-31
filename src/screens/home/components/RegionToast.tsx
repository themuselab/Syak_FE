import { CircleCheck } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { colors, shadow } from '@/shared/theme/colors';

// 관심 동네 설정 완료 안내(디자이너 시안 2026-10-27): 분홍 테두리 카드, 3초 뒤 사라진다(HomeScreen).
export function RegionToast({ name, bottom }: { name: string; bottom: number }) {
  return (
    <View pointerEvents="none" className="absolute left-5 right-5" style={{ bottom }}>
      <View
        className="flex-row gap-2 rounded-md border bg-white px-4 py-3"
        style={{ borderColor: colors.primary[300], ...shadow.md }}
      >
        <CircleCheck size={16} color={colors.primary[500]} style={{ marginTop: 1 }} />
        <View className="flex-1 gap-0.5">
          <Text className="font-pretendard-semibold" style={{ fontSize: 14, color: colors.text.strong }}>
            관심 동네를 {name}(으)로 설정했어요
          </Text>
          <Text className="font-pretendard" style={{ fontSize: 12, color: colors.text.subtle }}>
            {'마이 > 관심동네에서 바꿀 수 있어요'}
          </Text>
        </View>
      </View>
    </View>
  );
}
