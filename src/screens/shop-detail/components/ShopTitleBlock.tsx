import { Star } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import type { ShopDetailView } from '../shopDetailToView';
import { Badge } from './Badge';

const FAVORITE_COLOR = colors.accent.favorite;

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
              style={{ color: colors.overlay.shadow, letterSpacing: -0.48 }}
            >
              {shop.name}
            </Text>
            <Text className="font-pretendard text-[15px]" style={{ color: colors.text.muted }}>
              {shop.category}
            </Text>
          </View>
          <Text className="font-pretendard text-[12px]" style={{ color: colors.text.disabled }}>
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

      {/* 이벤트·가격대 배지: 여러 개일 때 잘리지 않게 좌우 슬라이드(캐러셀).
          긴 이벤트 문구는 Badge maxWidth로 한 장씩 잘라 보여준다(디자인 TO-BE). */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 4, paddingRight: 4 }}
      >
        {shop.badges.map((b, i) => {
          const isDeal = b.includes('특가') || b.includes('이벤트');
          return (
            <Badge
              key={`${b}-${i}`}
              label={b}
              bg={isDeal ? colors.brand.tint : colors.surface.mutedAlt}
              color={isDeal ? colors.brand.active : colors.text.subtleAlt}
              maxWidth={215}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
