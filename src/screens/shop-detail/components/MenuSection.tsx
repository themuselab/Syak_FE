import { Text, View } from 'react-native';

import type { MenuItem } from '../mockShopDetail';

type Props = {
  menus: MenuItem[];
};

// 메뉴·가격 섹션: 메뉴명 … 리더선 … 가격.
export function MenuSection({ menus }: Props) {
  return (
    <View className="gap-4">
      <Text
        className="font-pretendard-medium text-[18px]"
        style={{ color: '#1a1a1a', letterSpacing: -0.36 }}
      >
        메뉴·가격
      </Text>
      <View className="gap-4">
        {menus.map((m, i) => (
          <View key={i} className="flex-row items-center gap-1">
            <Text
              className="font-pretendard-medium text-[15px]"
              style={{ color: '#7e7e7e', letterSpacing: -0.3 }}
            >
              {m.name}
            </Text>
            <View className="h-px flex-1" style={{ backgroundColor: '#e6e6e6' }} />
            <Text
              className="font-pretendard-medium text-[15px]"
              style={{ color: '#1a1a1a', letterSpacing: -0.3 }}
            >
              {m.price}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
