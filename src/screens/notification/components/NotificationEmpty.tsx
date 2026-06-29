import { Text, View } from 'react-native';

// 빈 상태: 알림이 없을 때. (디자인 미제공 — BE 문서 05-notification.md 안내 문구 기준 임시 화면)
export function NotificationEmpty() {
  return (
    <View className="flex-1 items-center justify-center pt-16">
      <Text className="text-body-m font-pretendard text-gray-500">새로운 알림이 없습니다</Text>
    </View>
  );
}
