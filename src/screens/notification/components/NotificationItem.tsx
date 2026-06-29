import { Text, View } from 'react-native';

import type { NotificationItemData } from '../mockNotifications';

// 알림 한 줄: 회색 썸네일 + 제목/본문 + 우측 시각. 하단 1px 보더.
// 디자인 전용 hex(#e3e3e3/#1a1a1a/#7e7e7e/#bfbfbf/#f3f3f3)는 토큰 스케일에 없어 .pen 실측값 사용.
// 추후 탭 시 샵 상세 이동 연결 예정(현재는 비인터랙티브).
export function NotificationItem({ item }: { item: NotificationItemData }) {
  return (
    <View
      className="flex-row items-center gap-3 px-5 py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: '#f3f3f3' }}
    >
      <View className="h-10 w-10 rounded-lg" style={{ backgroundColor: '#e3e3e3' }} />
      <View className="flex-1 gap-2">
        <Text className="font-pretendard-medium" style={{ fontSize: 16, color: '#1a1a1a' }}>
          {item.title}
        </Text>
        <Text className="font-pretendard-medium" style={{ fontSize: 13, color: '#7e7e7e' }}>
          {item.body}
        </Text>
      </View>
      <Text className="font-pretendard" style={{ fontSize: 11, color: '#bfbfbf' }}>
        {item.timeAgo}
      </Text>
    </View>
  );
}
