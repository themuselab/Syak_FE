import { Text, View } from 'react-native';

import type { ShopDetail } from '../mockShopDetail';
import { Badge } from './Badge';

type Props = {
  shop: Pick<ShopDetail, 'name' | 'category' | 'reviewCount' | 'badges'>;
};

// 이름 + 분류 + 리뷰수 / 배지. 좌측 정렬.
export function ShopTitleBlock({ shop }: Props) {
  return (
    <View className="gap-2 px-5">
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
