import { CircleCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors, shadow } from '@/shared/theme/colors';

// 빈자리 알림 신청 완료 토스트 (디자이너 시안 2026-10-29): ✓ 빈자리 알림 신청 완료!   [내역보기]
// 관심 동네 토스트(RegionToast)와 같은 카드 모양. 3초 뒤 사라진다(useSlotAlertSheet).
export function SlotAlertToast({ bottom, onPressHistory }: { bottom: number; onPressHistory: () => void }) {
  return (
    <View pointerEvents="box-none" className="absolute left-5 right-5" style={{ bottom }}>
      <View
        className="flex-row items-center gap-2 rounded-md border bg-white py-3 pl-4 pr-3"
        style={{ borderColor: colors.primary[300], ...shadow.md }}
      >
        <CircleCheck size={16} color={colors.primary[500]} />
        <Text
          className="flex-1 font-pretendard-semibold"
          style={{ fontSize: 14, color: colors.text.strong }}
        >
          빈자리 알림 신청 완료!
        </Text>
        <Pressable
          onPress={onPressHistory}
          hitSlop={6}
          className="rounded-full px-2.5 py-1"
          style={{ borderWidth: 1, borderColor: colors.line.baseAlt2 }}
        >
          <Text className="font-pretendard-medium" style={{ fontSize: 12, color: colors.text.muted }}>
            내역보기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
