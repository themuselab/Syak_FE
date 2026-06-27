import { Text, View } from 'react-native';

type Props = { shopId: string };

// 디자인: designs/상세페이지/*, designs/design.pen (샵 상세 페이지)
export function ShopDetailScreen({ shopId }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-gray-900">샵 상세</Text>
      <Text className="mt-2 text-gray-500">shopId: {shopId}</Text>
    </View>
  );
}
