import { Pressable, ScrollView, Text, View } from 'react-native';

// 필터 카테고리: '전체' + 홈과 동일한 8종 시술 (순서는 즐겨찾기 디자인 lCEKa 기준).
export const FAVORITE_CATEGORIES = [
  '전체',
  '네일',
  '헤어',
  '속눈썹',
  '왁싱',
  '반영구',
  '피부',
  '마사지',
  '태닝',
] as const;
export type FavoriteCategory = (typeof FAVORITE_CATEGORIES)[number];

type Props = {
  active: FavoriteCategory;
  onSelect: (category: FavoriteCategory) => void;
};

// 카테고리 칩 가로 스크롤 (design.pen lCEKa: 60px 고정폭, r999, padding[8,10], gap 5,
// 활성 stroke #c24a6b + text #1a1a1a / 비활성 stroke #e6e6e6 + text #555, 14 Medium).
export function CategoryChips({ active, onSelect }: Props) {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 5 }}
      >
        {FAVORITE_CATEGORIES.map((category) => {
          const isActive = category === active;
          return (
            <Pressable
              key={category}
              onPress={() => onSelect(category)}
              className="items-center justify-center rounded-full"
              style={{
                width: 60,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: isActive ? '#c24a6b' : '#e6e6e6',
              }}
            >
              <Text
                className="font-pretendard-medium"
                style={{ fontSize: 14, color: isActive ? '#1a1a1a' : '#555555' }}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
