import { Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import type { ShopDetailView } from '../shopDetailToView';

type Props = {
  shop: Pick<ShopDetailView, 'name' | 'category' | 'locationLabel' | 'rating' | 'reviewCount'>;
  // 홈 포커스 시트(35%)에서만 타이틀 행에 별을 둔다. 라우트 화면은 헤더 별을 쓴다.
  favorite?: boolean;
  onToggleFavorite?: () => void;
};

// 샵 이름 블록 (디자이너 시안 2026-10-15).
//   예쁜 네일  네일샵
//   320m 전농동 • ★ 4.9 (리뷰 98)
// 평점은 DB에 없어서 지금은 "리뷰 98"만 나온다(평점이 생기면 별과 함께 자동 노출).
export function ShopTitleBlock({ shop, favorite, onToggleFavorite }: Props) {
  const reviewText = shop.rating != null ? `${shop.rating.toFixed(1)} (리뷰 ${shop.reviewCount})` : `리뷰 ${shop.reviewCount}`;

  return (
    <View className="gap-1.5 px-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-baseline gap-2 pr-2">
          <Text
            className="font-pretendard-semibold"
            numberOfLines={1}
            style={{ fontSize: 22, color: colors.text.strong, letterSpacing: -0.44, flexShrink: 1 }}
          >
            {shop.name}
          </Text>
          {!!shop.category && (
            <Text className="text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
              {shop.category}
            </Text>
          )}
        </View>
        {onToggleFavorite && (
          <Pressable onPress={onToggleFavorite} hitSlop={8}>
            <Star
              size={24}
              color={favorite ? colors.accent.favorite : colors.gray[300]}
              fill={favorite ? colors.accent.favorite : 'transparent'}
            />
          </Pressable>
        )}
      </View>

      <View className="flex-row items-center">
        {!!shop.locationLabel && (
          <>
            <Text className="text-caption-m font-pretendard" style={{ color: colors.text.subtle }}>
              {shop.locationLabel}
            </Text>
            <Text className="mx-1.5 text-caption-m" style={{ color: colors.line.strong }}>
              •
            </Text>
          </>
        )}
        {shop.rating != null && (
          <Star size={13} color={colors.accent.favorite} fill={colors.accent.favorite} style={{ marginRight: 3 }} />
        )}
        <Text className="text-caption-m font-pretendard" style={{ color: colors.text.subtle }}>
          {reviewText}
        </Text>
      </View>
    </View>
  );
}
