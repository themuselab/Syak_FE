import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type Props = {
  // true = 즐겨찾기 전체가 빈 상태(디자인 nBj0c — 버튼 포함).
  // false = 카테고리 필터 결과만 빈 상태(디자인 부재 — 문구만, 사용자 확정).
  showHomeButton: boolean;
};

// 빈 상태 (design.pen nBj0c): "즐겨찾는 샵이 없어요🥺" + (전체 빈일 때만) "메인으로 이동" 버튼.
export function FavoriteEmpty({ showHomeButton }: Props) {
  return (
    <View className="flex-1 justify-center px-5">
      <View style={{ gap: 40 }}>
        <Text
          className="font-pretendard-medium text-center"
          style={{ fontSize: 13, color: '#3f3f3f' }}
        >
          즐겨찾는 샵이 없어요🥺
        </Text>
        {showHomeButton && (
          <Pressable
            // 스택 내 기존 홈으로 복귀 (마이 → 즐겨찾기 경로에서 홈이 이미 스택에 있음)
            onPress={() => router.navigate('/home')}
            className="h-12 items-center justify-center rounded-sm bg-primary-500"
          >
            <Text className="font-pretendard-semibold text-white" style={{ fontSize: 16 }}>
              메인으로 이동
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
