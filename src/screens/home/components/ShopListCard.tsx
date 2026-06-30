import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import type { ShopCardView } from '../shopToView';

const FAVORITE_COLOR = '#FFC107';

function Badge({ label }: { label: string }) {
  const isDeal = label.includes('특가') || label.includes('이벤트');
  return (
    <View
      className="rounded px-1.5 py-0.5"
      style={{ backgroundColor: isDeal ? colors.primary[50] : colors.gray[100] }}
    >
      <Text
        className="text-caption-s font-pretendard-medium"
        numberOfLines={1}
        style={{ color: isDeal ? colors.primary[600] : colors.gray[600] }}
      >
        {label}
      </Text>
    </View>
  );
}

type Props = {
  shop: ShopCardView;
  onPress?: () => void;
  onToggleFavorite?: () => void;
};

// 매장 카드: 썸네일 + 이름/리뷰/주소/배지 + 즐겨찾기 별.
export function ShopListCard({ shop, onPress, onToggleFavorite }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b px-5 py-4"
      style={{ borderColor: '#f3f3f3' }}
    >
      {shop.photo ? (
        <Image
          source={{ uri: shop.photo }}
          style={{ width: 60, height: 60, borderRadius: 6 }}
          contentFit="cover"
        />
      ) : (
        <View className="h-[60px] w-[60px] rounded-md" style={{ backgroundColor: '#e3e3e3' }} />
      )}
      <View className="flex-1 flex-row items-center justify-between">
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-heading-m font-pretendard-semibold text-gray-900">{shop.name}</Text>
            {/* 리뷰수는 목록 응답 미제공 → 값이 있을 때만 표시 (백엔드 추가 시 자동 노출) */}
            {shop.reviewCount != null && (
              <Text className="text-caption-m font-pretendard-medium" style={{ color: '#adb5bd' }}>
                리뷰 {shop.reviewCount}
              </Text>
            )}
          </View>
          <Text className="text-body-m font-pretendard text-gray-600">{shop.address}</Text>
          <View className="flex-row gap-1">
            {shop.badges.map((b) => (
              <Badge key={b} label={b} />
            ))}
          </View>
        </View>
        <Pressable onPress={onToggleFavorite} hitSlop={8}>
          <Star
            size={24}
            color={shop.favorite ? FAVORITE_COLOR : colors.gray[300]}
            fill={shop.favorite ? FAVORITE_COLOR : 'transparent'}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}
