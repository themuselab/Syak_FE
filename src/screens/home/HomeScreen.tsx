import { Text, View } from 'react-native';

// 디자인: designs/홈지도뷰/*, designs/design.pen (홈 지도뷰 페이지)
export function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-gray-900">홈 (지도뷰)</Text>
      <Text className="mt-2 text-gray-500">designs/홈지도뷰 참고</Text>
    </View>
  );
}
