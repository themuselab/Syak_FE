import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import type { SlotAlert } from '@/shared/domain/notification/slotAlert.types';
import { colors } from '@/shared/theme/colors';

import { groupSlotAlerts } from '../groupSlotAlerts';
import { SlotAlertCard } from './SlotAlertCard';

type Props = {
  alerts: SlotAlert[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  editing: boolean;
  removed: Set<string>; // 편집 중 지운 id(아직 서버 반영 전)
  onRemove: (id: string) => void;
  bottomPad: number;
};

// 알림함 "신청 현황" 탭: 진행 중 카드들 + "종료된 알림" 섹션(회색).
export function SlotAlertRequests({
  alerts,
  isPending,
  isError,
  onRetry,
  editing,
  removed,
  onRemove,
  bottomPad,
}: Props) {
  const { active, ended } = useMemo(() => {
    const visible = (alerts ?? []).filter((a) => !removed.has(a.id));
    const now = new Date();
    return { active: groupSlotAlerts(visible, 'active', now), ended: groupSlotAlerts(visible, 'ended', now) };
  }, [alerts, removed]);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.primary[500]} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3">
        <Text className="font-pretendard-medium" style={{ fontSize: 15, color: colors.text.subtle }}>
          신청 현황을 불러오지 못했어요
        </Text>
        <Pressable onPress={onRetry}>
          <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: colors.primary[500] }}>
            다시 시도
          </Text>
        </Pressable>
      </View>
    );
  }

  if (active.length === 0 && ended.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-5 pb-16">
        <Text className="text-center font-pretendard-semibold" style={{ fontSize: 16, color: colors.text.strong }}>
          신청한 빈자리 알림이 없어요
        </Text>
        <Text className="mt-1.5 text-center text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
          샵의 빈자리 알림을 신청하면 여기서 볼 수 있어요
        </Text>
      </View>
    );
  }

  const openShop = (shopId: string) => {
    if (!editing) router.push(`/shop/${shopId}`);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: 4, paddingBottom: bottomPad, gap: 12 }}>
      {active.map((g) => (
        <SlotAlertCard
          key={g.key}
          group={g}
          editing={editing}
          onPressShop={() => openShop(g.shopId)}
          onRemove={onRemove}
        />
      ))}

      {ended.length > 0 && (
        <>
          <Text
            className="px-5 text-label-l font-pretendard-semibold"
            style={{ marginTop: active.length > 0 ? 20 : 0, color: colors.text.muted }}
          >
            종료된 알림
          </Text>
          {ended.map((g) => (
            <SlotAlertCard
              key={g.key}
              group={g}
              ended
              editing={editing}
              onPressShop={() => openShop(g.shopId)}
              onRemove={onRemove}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}
