import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useBottomInset } from '@/shared/lib/safeArea';
import { colors } from '@/shared/theme/colors';

const STORE = require('../../../../assets/images/favorite-empty.png');

type Props = {
  // true = 즐겨찾기 전체가 빈 상태(시안 "즐겨찾기-샵 없을때" — 하단 버튼 포함).
  // false = 카테고리 필터 결과만 빈 상태(시안 없음 — 버튼 없이 안내만, 사용자 확정).
  showHomeButton: boolean;
};

// 즐겨찾기 빈 상태 (디자이너 시안 2026-10-15): 회색 상점 아이콘 + 안내 두 줄 + 하단 "메인으로 이동".
export function FavoriteEmpty({ showHomeButton }: Props) {
  const bottomInset = useBottomInset();
  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center px-5 pb-16">
        <Image source={STORE} style={{ width: 64, height: 64 }} contentFit="contain" />
        <Text
          className="mt-5 text-center font-pretendard-semibold"
          style={{ fontSize: 16, color: colors.text.strong }}
        >
          아직 즐겨찾기한 샵이 없어요
        </Text>
        <Text className="mt-1.5 text-center text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
          마음에 드는 샵을 저장해 보세요!
        </Text>
      </View>
      {showHomeButton && (
        <View className="px-5" style={{ paddingBottom: bottomInset + 12 }}>
          <Pressable
            // 스택 내 기존 홈으로 복귀 (마이 → 즐겨찾기 경로에서 홈이 이미 스택에 있음)
            onPress={() => router.navigate('/home')}
            className="h-12 items-center justify-center rounded-sm"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Text className="font-pretendard-semibold" style={{ fontSize: 16, color: colors.white }}>
              메인으로 이동
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
