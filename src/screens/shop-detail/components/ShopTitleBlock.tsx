import { Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import type { ShopDetailView } from '../shopDetailToView';
import { Badge } from './Badge';

const FAVORITE_COLOR = '#FFC107';

type Props = {
  shop: Pick<ShopDetailView, 'name' | 'category' | 'reviewCount' | 'badges'>;
  // 타이틀 행 오른쪽 즐겨찾기 별(특정샵 포커스 시트 디자인 euK3A) — 홈 시트에서만 전달.
  favorite?: boolean;
  onToggleFavorite?: () => void;
};

// 이름 + 분류 + 리뷰수 (+옵션: 별) / 배지. 좌측 정렬.
export function ShopTitleBlock({ shop, favorite, onToggleFavorite }: Props) {
  return (
    <View className="gap-2 px-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-5">
          <View className="flex-row items-center gap-2">
            <Text
              className="font-pretendard-semibold text-[24px]"
              style={{ color: '#000000', letterSpacing: -0.48 }}
            >
              {shop.name}
            </Text>
            <Text className="font-pretendard text-[15px]" style={{ color: '#555555' }}>
              {shop.category}
            </Text>
          </View>
          <Text className="font-pretendard text-[12px]" style={{ color: '#bfbfbf' }}>
            리뷰 {shop.reviewCount}
          </Text>
        </View>
        {onToggleFavorite && (
          <Pressable onPress={onToggleFavorite} hitSlop={8}>
            <Star
              size={24}
              color={favorite ? FAVORITE_COLOR : colors.gray[300]}
              fill={favorite ? FAVORITE_COLOR : 'transparent'}
            />
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-1">
        {shop.badges.map((b, i) => {
          const isDeal = b.includes('특가') || b.includes('이벤트');
          return (
            <Badge
              key={`${b}-${i}`}
              label={b}
              bg={isDeal ? '#fff1f6' : '#f1f1f1'}
              color={isDeal ? '#b32f58' : '#7a7a7a'}
            />
          );
        })}
      </View>
    </View>
  );
}
