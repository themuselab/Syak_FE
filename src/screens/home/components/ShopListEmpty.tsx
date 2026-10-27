import { RotateCcw } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { InfoBadge } from '@/shared/ui/InfoBadge';

import { useHomeFilterStore } from '../useHomeFilterStore';

// 빈 상태(디자이너 시안 "필터링 시 조건샵 없을 때" / "검색결과 없을 때"): 회색 (i) + 문구.
//  - 검색 중: "검색 결과가 없어요" + 다른 검색어 안내
//  - 그 외(필터): "조건에 맞는 샵을 찾지 못했어요" + ↻ 필터 초기화
export function ShopListEmpty({ onReset }: { onReset: () => void }) {
  const searching = useHomeFilterStore((s) => s.search.trim().length > 0);
  return (
    <View className="items-center justify-center gap-1.5 self-stretch pt-14">
      <InfoBadge />
      {/* w-full+text-center: 커스텀 폰트의 Android 폭 측정 오차로 문장 뒷부분이 잘리는 문제 방어 (QA #11) */}
      <Text
        className="mt-3 w-full px-5 text-center font-pretendard-semibold"
        style={{ fontSize: 15, color: colors.text.strong }}
      >
        {searching ? '검색 결과가 없어요' : '조건에 맞는 샵을 찾지 못했어요'}
      </Text>
      {searching ? (
        <Text className="w-full px-5 text-center font-pretendard" style={{ fontSize: 13, color: colors.text.subtle }}>
          다른 검색어로 마음에 드는 샵을 찾아보세요.
        </Text>
      ) : (
        <Pressable onPress={onReset} className="flex-row items-center gap-1 py-1" hitSlop={8}>
          <RotateCcw size={14} color={colors.text.strong} />
          <Text className="font-pretendard-medium" style={{ fontSize: 13, color: colors.text.strong }}>
            필터 초기화
          </Text>
        </Pressable>
      )}
    </View>
  );
}
