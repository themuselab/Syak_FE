import { Text, View } from 'react-native';

// 디자인: designs/알림/*, designs/design.pen (알림 페이지)
export function NotificationScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-gray-900">알림</Text>
      <Text className="mt-2 text-gray-500">designs/알림 참고</Text>
    </View>
  );
}
