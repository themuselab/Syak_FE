import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

const FAVORITE_COLOR = '#FFC107';

// 카드가 실제로 쓰는 필드만의 구조적 타입 — 홈 ShopCardView(지도 필드 포함)와
// 즐겨찾기 화면의 상세 파생 카드가 모두 이 형태를 만족한다.
export type ShopCardInfo = {
  name: string;
  reviewCount: number | null; // null이면 숨김
  address: string;
  badges: string[];
  favorite: boolean;
  photo: string | null;
};

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
  shop: ShopCardInfo;
  onPress?: () => void;
  onToggleFavorite?: () => void;
};

// 매장 카드: 썸네일 + 이름/리뷰/주소/배지 + 즐겨찾기 별. (홈 목록·즐겨찾기 목록 공용)
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
        {/* flex-1: 배지 줄바꿈(flex-wrap)이 동작하려면 컬럼에 폭 제약이 필요 (QA #46) */}
        <View className="flex-1 gap-1 pr-2">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-heading-m font-pretendard-semibold text-gray-900"
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {shop.name}
            </Text>
            {/* 리뷰수는 목록 응답 미제공 → 값이 있을 때만 표시 (백엔드 추가 시 자동 노출) */}
            {shop.reviewCount != null && (
              <Text className="text-caption-m font-pretendard-medium" style={{ color: '#adb5bd' }}>
                리뷰 {shop.reviewCount}
              </Text>
            )}
          </View>
          <Text className="text-body-m font-pretendard text-gray-600">{shop.address}</Text>
          <View className="flex-row flex-wrap gap-1">
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
