import { Image } from 'expo-image';
import { Megaphone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import type { AppNewsItem } from '@/shared/domain/notification/notification.types';
import { formatRelativeTime } from '@/shared/lib/date';
import { colors } from '@/shared/theme/colors';

// 앱 소식(공지·마케팅) 한 줄 — 매장 알림(NotificationItem)과 동일 레이아웃 준용.
// 디자인 부재(임시 — 디자이너 확인 항목, docs/notification.md): 썸네일 자리에 imageUrl 또는 확성기 아이콘.
// 읽음은 서버 미관리 → 기기 로컬(read prop) 기준으로 도트 표시.
export function AppNewsCard({
  item,
  read,
  onPress,
}: {
  item: AppNewsItem;
  read: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-5 py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: '#f3f3f3' }}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: 40, height: 40, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : (
        <View
          className="h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: '#fdeef2' }}
        >
          <Megaphone size={18} color={colors.primary[500]} />
        </View>
      )}
      <View className="flex-1 gap-2">
        <View className="flex-row items-center gap-1.5">
          {!read && (
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary[500] }}
            />
          )}
          <Text
            className="font-pretendard-medium"
            numberOfLines={1}
            style={{ fontSize: 16, color: '#1a1a1a', flexShrink: 1 }}
          >
            {item.title}
          </Text>
        </View>
        <Text
          className="font-pretendard-medium"
          numberOfLines={2}
          style={{ fontSize: 13, color: '#7e7e7e' }}
        >
          {item.body}
        </Text>
      </View>
      <Text className="font-pretendard" style={{ fontSize: 11, color: '#bfbfbf' }}>
        {formatRelativeTime(item.publishedAt)}
      </Text>
    </Pressable>
  );
}
