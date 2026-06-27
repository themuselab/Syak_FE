import { Text, View } from 'react-native';

// 디자인: designs/마이페이지/*, designs/design.pen (마이페이지)
export function MyScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-gray-900">마이페이지</Text>
      <Text className="mt-2 text-gray-500">designs/마이페이지 참고</Text>
    </View>
  );
}
