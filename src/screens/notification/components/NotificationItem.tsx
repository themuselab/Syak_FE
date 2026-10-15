import { Pressable, Text, View } from 'react-native';

import type { NotificationItem as NotificationItemData } from '@/shared/domain/notification/notification.types';
import { formatRelativeTime } from '@/shared/lib/date';
import { colors } from '@/shared/theme/colors';

// 알림 한 줄: 회색 썸네일 + 제목/본문 + 우측 시각. 하단 1px 보더. 탭 → 샵 상세.
// 문구는 designs/알림/알림.png 캡처 그대로 (제목 `{샵명} {시간} 빈자리 알림!` + 고정 본문, 타입별 구분 없음 — 사용자 확정).
// 디자인 전용 hex(#e3e3e3/#1a1a1a/#7e7e7e/#bfbfbf/#f3f3f3)는 토큰 스케일에 없어 .pen 실측값 사용.
// 미읽음 도트는 디자인 미제공 — 임시안(6px 핑크, 사용자 확정), 디자이너 확인 후 조정.
const BODY_TEXT = '빠르게 예약하지 않으면 빈자리가 금방 사라져요!';

export function NotificationItem({
  item,
  onPress,
}: {
  item: NotificationItemData;
  onPress: () => void;
}) {
  const unread = item.readAt === null;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-3 px-5 py-3.5"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.line.divider }}
    >
      <View className="h-10 w-10 rounded-sm" style={{ backgroundColor: colors.line.base }} />
      <View className="flex-1 gap-1 pt-0.5">
        <View className="flex-row items-center gap-1.5">
          {unread && (
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary[500] }}
            />
          )}
          <Text className="font-pretendard-semibold" numberOfLines={1} style={{ fontSize: 14, color: colors.text.strong, flexShrink: 1 }}>
            {item.shopName} {item.slotTime} 빈자리 알림!
          </Text>
        </View>
        <Text className="font-pretendard" numberOfLines={1} style={{ fontSize: 12, color: colors.text.subtle }}>
          {BODY_TEXT}
        </Text>
      </View>
      {/* 시간은 오른쪽 위(시안) */}
      <Text className="pt-0.5 font-pretendard" style={{ fontSize: 11, color: colors.text.disabled }}>
        {formatRelativeTime(item.createdAt)}
      </Text>
    </Pressable>
  );
}
