import { FlatList, View } from 'react-native';

import { BackHeader } from '@/shared/ui/BackHeader';

import { NotificationEmpty } from './components/NotificationEmpty';
import { NotificationItem } from './components/NotificationItem';
import { MOCK_NOTIFICATIONS } from './mockNotifications';

// 디자인: designs/알림/*, designs/design.pen (알림 페이지, frame SXtVD)
// 프론트 UI 전용 — 목 데이터로 렌더. 백엔드(React Query) 연동은 추후.
export function NotificationScreen() {
  const notifications = MOCK_NOTIFICATIONS;

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="알림" />
      {notifications.length === 0 ? (
        <NotificationEmpty />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
        />
      )}
    </View>
  );
}
